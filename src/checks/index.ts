import { Check } from "../types.js";
import { toolPoisoning } from "./toolPoisoning.js";
import { capabilityExposure } from "./capabilityExposure.js";

export const CHECKS: Check[] = [toolPoisoning, capabilityExposure];
