import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import archiver from 'archiver';
import { prisma } from '../server';
import { AuthenticatedRequest } from '../middleware/auth';
import { CodebaseFlattener } from '../../../cli/src/utils/CodebaseFlattener';

const router = Router();
const flattener = new CodebaseFlattener();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
});

// Validation middleware
const validateRequest = (req: AuthenticatedRequest, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  next();
};

// POST /api/codebase/upload - Upload codebase files
router.post('/upload',
  upload.single('codebase'),
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { originalname, path: filePath, size } = req.file;
      const { name, description, projectId } = req.body;

      // Validate project if provided
      if (projectId) {
        const project = await prisma.project.findFirst({
          where: {
            id: projectId,
            userId: req.user!.id
          }
        });

        if (!project) {
          return res.status(404).json({ error: 'Project not found' });
        }
      }

      // Create codebase snapshot record
      const snapshot = await prisma.codebaseSnapshot.create({
        data: {
          name: name || `Uploaded ${originalname}`,
          description,
          filePath,
          format: 'zip',
          size,
          projectId: projectId || null
        }
      });

      res.status(201).json({
        message: 'Codebase uploaded successfully',
        snapshot: {
          id: snapshot.id,
          name: snapshot.name,
          description: snapshot.description,
          size: snapshot.size,
          createdAt: snapshot.createdAt
        }
      });
    } catch (error) {
      console.error('Upload codebase error:', error);
      res.status(500).json({ error: 'Failed to upload codebase' });
    }
  }
);

// POST /api/codebase/flatten - Flatten a codebase directory or uploaded file
router.post('/flatten',
  [
    body('source').isString().withMessage('Source path or snapshot ID is required'),
    body('sourceType').isIn(['directory', 'snapshot']).withMessage('Source type must be directory or snapshot'),
    body('format').optional().isIn(['xml', 'json', 'markdown']).withMessage('Format must be xml, json, or markdown'),
    body('name').optional().trim().isLength({ max: 200 }),
    body('includeComments').optional().isBoolean(),
    body('minifyOutput').optional().isBoolean(),
    body('includePatterns').optional().isArray(),
    body('excludePatterns').optional().isArray(),
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res) => {
    try {
      const {
        source,
        sourceType,
        format = 'xml',
        name,
        includeComments = true,
        minifyOutput = false,
        includePatterns = ['**/*'],
        excludePatterns = [
          'node_modules/**',
          '.git/**',
          'dist/**',
          'build/**',
          '*.log',
          '.env*'
        ]
      } = req.body;

      let sourceDirectory: string;

      if (sourceType === 'snapshot') {
        // Extract uploaded file to temporary directory
        const snapshot = await prisma.codebaseSnapshot.findFirst({
          where: { id: source }
        });

        if (!snapshot) {
          return res.status(404).json({ error: 'Snapshot not found' });
        }

        // TODO: Extract zip file and get directory path
        sourceDirectory = snapshot.filePath; // This would need extraction logic
      } else {
        sourceDirectory = source;
      }

      // Validate directory exists
      if (!await fs.pathExists(sourceDirectory)) {
        return res.status(400).json({ error: 'Source directory not found' });
      }

      const config = {
        includeComments,
        minifyOutput,
        treeOnly: false,
        outputFormat: format as 'xml' | 'json' | 'markdown',
        includePatterns,
        excludePatterns
      };

      // Flatten the codebase
      const result = await flattener.flattenDirectory(sourceDirectory, config);
      const output = await flattener.generateOutput(result, config);

      // Save the flattened output
      const outputPath = path.join('outputs', `${Date.now()}-flattened.${format}`);
      await fs.ensureDir(path.dirname(outputPath));
      await fs.writeFile(outputPath, output);

      // Create snapshot record
      const snapshot = await prisma.codebaseSnapshot.create({
        data: {
          name: name || `Flattened Codebase ${new Date().toLocaleDateString()}`,
          description: `Flattened codebase in ${format} format`,
          filePath: outputPath,
          format,
          size: output.length
        }
      });

      res.json({
        message: 'Codebase flattened successfully',
        snapshot: {
          id: snapshot.id,
          name: snapshot.name,
          format: snapshot.format,
          size: snapshot.size,
          createdAt: snapshot.createdAt
        },
        stats: {
          totalFiles: result.metadata.totalFiles,
          totalSize: result.metadata.totalSize,
          processingTime: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Flatten codebase error:', error);
      res.status(500).json({ error: 'Failed to flatten codebase' });
    }
  }
);

// GET /api/codebase/snapshots - List codebase snapshots
router.get('/snapshots',
  [
    query('projectId').optional().isUUID(),
    query('format').optional().isIn(['xml', 'json', 'markdown', 'zip']),
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { projectId, format } = req.query;

      const whereClause: any = {};
      if (projectId) whereClause.projectId = projectId;
      if (format) whereClause.format = format;

      const snapshots = await prisma.codebaseSnapshot.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          description: true,
          format: true,
          size: true,
          projectId: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      res.json(snapshots);
    } catch (error) {
      console.error('Get snapshots error:', error);
      res.status(500).json({ error: 'Failed to fetch snapshots' });
    }
  }
);

// GET /api/codebase/snapshots/:id - Get a specific snapshot
router.get('/snapshots/:id',
  [param('id').isUUID()],
  validateRequest,
  async (req: AuthenticatedRequest, res) => {
    try {
      const snapshot = await prisma.codebaseSnapshot.findUnique({
        where: { id: req.params.id }
      });

      if (!snapshot) {
        return res.status(404).json({ error: 'Snapshot not found' });
      }

      res.json(snapshot);
    } catch (error) {
      console.error('Get snapshot error:', error);
      res.status(500).json({ error: 'Failed to fetch snapshot' });
    }
  }
);

// GET /api/codebase/snapshots/:id/download - Download a snapshot
router.get('/snapshots/:id/download',
  [param('id').isUUID()],
  validateRequest,
  async (req: AuthenticatedRequest, res) => {
    try {
      const snapshot = await prisma.codebaseSnapshot.findUnique({
        where: { id: req.params.id }
      });

      if (!snapshot) {
        return res.status(404).json({ error: 'Snapshot not found' });
      }

      const filePath = snapshot.filePath;
      
      if (!await fs.pathExists(filePath)) {
        return res.status(404).json({ error: 'Snapshot file not found' });
      }

      const fileName = `${snapshot.name.replace(/[^a-z0-9]/gi, '_')}.${snapshot.format}`;
      
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Download snapshot error:', error);
      res.status(500).json({ error: 'Failed to download snapshot' });
    }
  }
);

// POST /api/codebase/analyze - Analyze a codebase directory
router.post('/analyze',
  [
    body('directory').isString().withMessage('Directory path is required'),
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { directory } = req.body;

      if (!await fs.pathExists(directory)) {
        return res.status(400).json({ error: 'Directory not found' });
      }

      const analysis = await flattener.analyzeCodebase(directory);

      res.json({
        message: 'Codebase analysis completed',
        analysis
      });
    } catch (error) {
      console.error('Analyze codebase error:', error);
      res.status(500).json({ error: 'Failed to analyze codebase' });
    }
  }
);

// DELETE /api/codebase/snapshots/:id - Delete a snapshot
router.delete('/snapshots/:id',
  [param('id').isUUID()],
  validateRequest,
  async (req: AuthenticatedRequest, res) => {
    try {
      const snapshot = await prisma.codebaseSnapshot.findUnique({
        where: { id: req.params.id }
      });

      if (!snapshot) {
        return res.status(404).json({ error: 'Snapshot not found' });
      }

      // Delete the file if it exists
      if (await fs.pathExists(snapshot.filePath)) {
        await fs.remove(snapshot.filePath);
      }

      // Delete the database record
      await prisma.codebaseSnapshot.delete({
        where: { id: req.params.id }
      });

      res.json({ message: 'Snapshot deleted successfully' });
    } catch (error) {
      console.error('Delete snapshot error:', error);
      res.status(500).json({ error: 'Failed to delete snapshot' });
    }
  }
);

export default router;