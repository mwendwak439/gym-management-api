import { Router } from "express";
import * as memberController from "../controllers/memberController";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { validateQuery } from "../middleware/validateQuery";
import {
  createMemberSchema,
  updateMemberSchema,
  memberQuerySchema
} from "../schemas/memberSchemas";

const router = Router();

// All member routes require authentication
router.use(authenticate);

// Member's own profile (any authenticated user)
router.get("/me", memberController.getMyProfile);

// Staff/admin routes
router.get(
  "/",
  authorize("admin", "staff"),
  validateQuery(memberQuerySchema),
  memberController.getAll
);

router.get("/:id", authorize("admin", "staff"), memberController.getById);

router.post(
  "/",
  authorize("admin", "staff"),
  validate(createMemberSchema),
  memberController.create
);

router.put(
  "/:id",
  authorize("admin", "staff"),
  validate(updateMemberSchema),
  memberController.update
);

router.delete("/:id", authorize("admin"), memberController.remove);

export default router;