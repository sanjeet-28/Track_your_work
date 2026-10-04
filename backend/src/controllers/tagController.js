const prisma = require('../lib/prisma');

async function getTags(req, res, next) {
  try {
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: { tasks: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    const formatted = tags.map(t => ({
      id: t.id,
      name: t.name,
      color: t.color,
      taskCount: t._count.tasks
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
}

async function createTag(req, res, next) {
  try {
    const { name, color = '#94a3b8' } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Tag name is required' });
    }

    const tag = await prisma.tag.create({
      data: {
        name: name.trim().toLowerCase(),
        color
      }
    });

    res.status(201).json({ success: true, data: tag });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, error: 'A tag with this name already exists' });
    }
    next(error);
  }
}

async function deleteTag(req, res, next) {
  try {
    const { id } = req.params;
    await prisma.tag.delete({ where: { id } });
    res.json({ success: true, id });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Tag not found' });
    }
    next(error);
  }
}

module.exports = {
  getTags,
  createTag,
  deleteTag
};
