/**
 * Statistics Controller
 * Feature: panel-super-admin
 * 
 * Handles HTTP requests for system statistics
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import StatisticsService from '../services/StatisticsService';

export class StatisticsController {
  
  /**
   * GET /api/super-admin/statistics
   * Get system-wide statistics
   */
  async getSystemStatistics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const statistics = await StatisticsService.getSystemStatistics();
      res.status(200).json(statistics);
    } catch (error: any) {
      console.error('Error getting statistics:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas del sistema' });
    }
  }
}

export default new StatisticsController();
