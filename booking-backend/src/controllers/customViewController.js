import CustomView from '../models/CustomView.js';

export const createCustomView = async (req, res) => {
  try {
    const view = new CustomView({ ...req.body, vendor: req.user.vendor });
    await view.save();
    res.status(201).json(view);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getCustomViews = async (req, res) => {
  try {
    const views = await CustomView.find({ vendor: req.user.vendor });
    res.json(views);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getCustomView = async (req, res) => {
  try {
    const view = await CustomView.findOne({ _id: req.params.id, vendor: req.user.vendor });
    if (!view) return res.status(404).json({ message: 'Custom view not found' });
    res.json(view);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateCustomView = async (req, res) => {
  try {
    const view = await CustomView.findOneAndUpdate({ _id: req.params.id, vendor: req.user.vendor }, req.body, { new: true });
    if (!view) return res.status(404).json({ message: 'Custom view not found' });
    res.json(view);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteCustomView = async (req, res) => {
  try {
    const view = await CustomView.findOneAndDelete({ _id: req.params.id, vendor: req.user.vendor });
    if (!view) return res.status(404).json({ message: 'Custom view not found' });
    res.json({ message: 'Custom view deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
