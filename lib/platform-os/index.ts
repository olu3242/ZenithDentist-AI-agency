import "server-only";

export {
  aliceLoop,
  autonomyModes,
  getPlatformFoundationState,
  platformAgents,
  platformOsLayers,
  reusablePlatformRequirements,
  reusableProducts
} from "@/lib/platform-os/foundation";

export type {
  AgentType,
  AliceResponsibility,
  AutonomyLevel,
  PlatformAgentDefinition,
  PlatformAutonomyMode,
  PlatformFoundationState,
  PlatformOsDefinition,
  PlatformOsKey,
  PlatformProductKey
} from "@/lib/platform-os/foundation";
