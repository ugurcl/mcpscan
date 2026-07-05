import { Check } from "../types.js";
import { toolPoisoning } from "./toolPoisoning.js";
import { capabilityExposure } from "./capabilityExposure.js";
import { linkExfiltration } from "./linkExfiltration.js";

export const CHECKS: Check[] = [toolPoisoning, capabilityExposure, linkExfiltration];
