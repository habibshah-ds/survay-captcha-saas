import * as OrgService from "./org.service.js";

export const createOrgController = async (req, res) => {
  try {
    const org = await OrgService.createOrg(req.user.id, req.body);
    res.json(org);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const myOrgController = async (req, res) => {
  const org = await OrgService.getOrg(req.user.id);
  res.json(org);
};
