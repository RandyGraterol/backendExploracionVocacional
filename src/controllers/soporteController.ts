import { Request, Response } from 'express';
import { SoporteRequest, Usuario } from '../models';

// GET - Obtener todas las solicitudes
export const getAll = async (_req: Request, res: Response) => {
  try {
    const solicitudes = await SoporteRequest.findAll({
      include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'apellido', 'email'] }],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(solicitudes);
  } catch (error) {
    console.error('Error fetching solicitudes:', error);
    res.status(500).json({ error: 'Error al obtener las solicitudes' });
  }
};

// GET - Obtener solicitudes por usuario
export const getByUserId = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const solicitudes = await SoporteRequest.findAll({
      where: { userId: parseInt(userId) },
      order: [['createdAt', 'DESC']]
    });
    
    res.json(solicitudes);
  } catch (error) {
    console.error('Error fetching solicitudes:', error);
    res.status(500).json({ error: 'Error al obtener las solicitudes' });
  }
};

// POST - Crear nueva solicitud
export const create = async (req: Request, res: Response) => {
  try {
    const { userId, userName, userEmail, tipo, mensaje } = req.body;
    
    if (!userName || !userEmail || !tipo || !mensaje) {
      return res.status(400).json({ error: 'userName, userEmail, tipo y mensaje son requeridos' });
    }
    
    const solicitud = await SoporteRequest.create({
      userId,
      userName,
      userEmail,
      tipo,
      mensaje,
      status: 'pending'
    });
    
    res.status(201).json(solicitud);
  } catch (error) {
    console.error('Error creating solicitud:', error);
    res.status(500).json({ error: 'Error al crear la solicitud' });
  }
};

// PUT - Responder solicitud
export const respond = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { respuesta, status } = req.body;
    
    const solicitud = await SoporteRequest.findByPk(id);
    if (!solicitud) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }
    
    await solicitud.update({ 
      respuesta, 
      status: status || 'resolved' 
    });
    
    res.json(solicitud);
  } catch (error) {
    console.error('Error responding solicitud:', error);
    res.status(500).json({ error: 'Error al responder la solicitud' });
  }
};

// DELETE - Eliminar solicitud
export const remove = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const solicitud = await SoporteRequest.findByPk(id);
    if (!solicitud) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }
    
    await solicitud.destroy();
    
    res.json({ message: 'Solicitud eliminada correctamente' });
  } catch (error) {
    console.error('Error deleting solicitud:', error);
    res.status(500).json({ error: 'Error al eliminar la solicitud' });
  }
};
