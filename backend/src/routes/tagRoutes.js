const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tagController');

router.get('/', tagController.getTags);
router.post('/', tagController.createTag);
router.delete('/:id', tagController.deleteTag);

module.exports = router;
