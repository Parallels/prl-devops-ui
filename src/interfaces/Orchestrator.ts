import { HardwareResourceStats } from "./devops";

export interface OrchestratorResource {
  cpu_type:        string;
  system_reserved: HardwareResourceStats;
  total:           HardwareResourceStats;
  total_available: HardwareResourceStats;
  total_in_use:    HardwareResourceStats;
  total_reserved:  HardwareResourceStats;
}
