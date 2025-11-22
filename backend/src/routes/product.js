import { Router } from "express";
import { createProduct, listProducts, getProduct } from "../controllers/productController.js";
const router = Router();
router.post("/", createProduct);
router.get("/", listProducts);
router.get("/:id", getProduct);
export default router;