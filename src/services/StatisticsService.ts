/**
 * Statistics Service
 * Feature: panel-super-admin
 * 
 * Provides system-wide statistics for the super admin dashboard
 */

import Usuario from '../models/Usuario';
import Actividad from '../models/Actividad';
import PreguntaConocimiento from '../models/PreguntaConocimiento';
import Rama from '../models/Rama';
import Video from '../models/Video';

export interface SystemStatistics {
  totalUsers: number;
  usersByRole: {
    student: number;
    admin: number;
    super_admin: number;
  };
  totalActivities: number;
  totalTests: number;
  totalRamas: number;
  totalVideos: number;
}

export class StatisticsService {
  
  /**
   * Get system-wide statistics
   * @returns System statistics object
   */
  async getSystemStatistics(): Promise<SystemStatistics> {
    try {
      // Count total users
      const totalUsers = await Usuario.count();

      // Count users by role
      const studentCount = await Usuario.count({ where: { rol: 'student' } });
      const adminCount = await Usuario.count({ where: { rol: 'admin' } });
      const superAdminCount = await Usuario.count({ where: { rol: 'super_admin' } });

      // Count activities
      const totalActivities = await Actividad.count();

      // Count test questions (knowledge test questions)
      const totalTests = await PreguntaConocimiento.count();

      // Count ramas
      const totalRamas = await Rama.count();

      // Count videos
      const totalVideos = await Video.count();

      return {
        totalUsers,
        usersByRole: {
          student: studentCount,
          admin: adminCount,
          super_admin: superAdminCount
        },
        totalActivities,
        totalTests,
        totalRamas,
        totalVideos
      };
    } catch (error) {
      console.error('Error getting system statistics:', error);
      throw new Error('Error al obtener estadísticas del sistema');
    }
  }
}

export default new StatisticsService();
