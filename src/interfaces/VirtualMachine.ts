/*
  * Virtual machine from API
*/
export interface VirtualMachine {
  ID: string;
  host_id: string;
  host_name: string;
  host_external_ip_address: string;
  internal_ip_address: string;
  user: string;
  Name: string;
  Description: string;
  Type: string;
  State: string;
  OS: string;
  Template: string;
  Uptime: string;
  "Home path": string;
  Home: string;
  "Restore Image": string;
  GuestTools: VirtualMachineGuestTools;
  "Mouse and Keyboard": VirtualMachineMouseAndKeyboard;
  "USB and Bluetooth": VirtualMachineUSBAndBluetooth;
  "Startup and Shutdown": VirtualMachineStartupAndShutdown;
  Optimization: VirtualMachineOptimization;
  "Travel mode": VirtualMachineTravelMode;
  Security: VirtualMachineSecurity;
  "Smart Guard": VirtualMachineExpiration;
  Modality: VirtualMachineModality;
  Fullscreen: VirtualMachineFullscreen;
  Coherence: VirtualMachineCoherence;
  "Time Synchronization": VirtualMachineTimeSynchronization;
  Expiration: VirtualMachineExpiration;
  "Boot order": string;
  "BIOS type": string;
  "EFI Secure boot": string;
  "Allow select boot device": string;
  "External boot device": string;
  "SMBIOS settings": VirtualMachineSMBIOSSettings;
  Hardware: VirtualMachineHardware;
  "Host Shared Folders": VirtualMachineExpiration;
  "Host defined sharing": string;
  "Shared Profile": VirtualMachineExpiration;
  "Shared Applications": VirtualMachineSharedApplications;
  SmartMount: VirtualMachineSmartMount;
  "Miscellaneous Sharing": VirtualMachineMiscellaneousSharing;
  Advanced: VirtualMachineAdvanced;
  "Print Management": VirtualMachinePrintManagement;
  "Guest Shared Folders": VirtualMachineGuestSharedFolders;
  Network: VirtualMachineNetwork;
  [key: string]: unknown;
}

export interface VirtualMachineAdvanced {
  "VM hostname synchronization": string;
  "Public SSH keys synchronization": string;
  "Show developer tools": string;
  "Swipe from edges": string;
  "Share host location": string;
  "Rosetta Linux": string;
}

export interface VirtualMachineCoherence {
  "Show Windows systray in Mac menu": string;
  "Auto-switch to full screen": string;
  "Disable aero": string;
  "Hide minimized windows": string;
}

export interface VirtualMachineExpiration {
  enabled: boolean;
}

export interface VirtualMachineFullscreen {
  "Use all displays": string;
  "Activate spaces on click": string;
  "Optimize for games": string;
  "Gamma control": string;
  "Scale view mode": string;
}

export interface VirtualMachineGuestSharedFolders {
  enabled: boolean;
  Automount: string;
}

export interface VirtualMachineGuestTools {
  state: string;
  version: string;
}

export interface VirtualMachineHardware {
  cpu: VirtualMachineCPU;
  memory: VirtualMachineMemory;
  video: VirtualMachineVideo;
  memory_quota: VirtualMachineMemoryQuota;
  hdd0: VirtualMachineHdd0;
  cdrom0: VirtualMachineCdrom0;
  usb: VirtualMachineExpiration;
  net0: VirtualMachineNet0;
  sound0: VirtualMachineSound0;
}

export interface VirtualMachineCdrom0 {
  enabled: boolean;
  port: string;
  image: string;
  state: string;
}

export interface VirtualMachineCPU {
  cpus: number;
  auto: string;
  "VT-x": boolean;
  hotplug: boolean;
  accl: string;
  mode: string;
  type: string;
}

export interface VirtualMachineHdd0 {
  enabled: boolean;
  port: string;
  image: string;
  type: string;
  size: string;
  "online-compact": string;
}

export interface VirtualMachineMemory {
  size: string;
  auto: string;
  hotplug: boolean;
}

export interface VirtualMachineMemoryQuota {
  auto: string;
}

export interface VirtualMachineNet0 {
  enabled: boolean;
  type: string;
  mac: string;
  card: string;
}

export interface VirtualMachineSound0 {
  enabled: boolean;
  output: string;
  mixer: string;
}

export interface VirtualMachineVideo {
  "adapter-type": string;
  size: string;
  "3d-acceleration": string;
  "vertical-sync": string;
  "high-resolution": string;
  "high-resolution-in-guest": string;
  "native-scaling-in-guest": string;
  "automatic-video-memory": string;
}

export interface VirtualMachineMiscellaneousSharing {
  "Shared clipboard": string;
  "Shared cloud": string;
}

export interface VirtualMachineModality {
  "Opacity (percentage)": number;
  "Stay on top": string;
  "Show on all spaces ": string;
  "Capture mouse clicks": string;
}

export interface VirtualMachineMouseAndKeyboard {
  "Smart mouse optimized for games": string;
  "Sticky mouse": string;
  "Smooth scrolling": string;
  "Keyboard optimization mode": string;
}

export interface VirtualMachineNetwork {
  Conditioned: string;
  Inbound: VirtualMachineBound;
  Outbound: VirtualMachineBound;
  ipAddresses: VirtualMachineIPAddress[];
}

export interface VirtualMachineBound {
  Bandwidth: string;
  "Packet Loss": string;
  Delay: string;
}

export interface VirtualMachineIPAddress {
  type: string;
  ip: string;
}

export interface VirtualMachineOptimization {
  "Faster virtual machine": string;
  "Hypervisor type": string;
  "Adaptive hypervisor": string;
  "Disabled Windows logo": string;
  "Auto compress virtual disks": string;
  "Nested virtualization": string;
  "PMU virtualization": string;
  "Longer battery life": string;
  "Show battery status": string;
  "Resource quota": string;
}

export interface VirtualMachinePrintManagement {
  "Synchronize with host printers": string;
  "Synchronize default printer": string;
  "Show host printer UI": string;
}

export interface VirtualMachineSMBIOSSettings {
  "BIOS Version": string;
  "System serial number": string;
  "Board Manufacturer": string;
}

export interface VirtualMachineSecurity {
  Encrypted: string;
  "TPM enabled": string;
  "TPM type": string;
  "Custom password protection": string;
  "Configuration is locked": string;
  Protected: string;
  Archived: string;
  Packed: string;
}

export interface VirtualMachineSharedApplications {
  enabled: boolean;
  "Host-to-guest apps sharing": string;
  "Guest-to-host apps sharing": string;
  "Show guest apps folder in Dock": string;
  "Show guest notifications": string;
  "Bounce dock icon when app flashes": string;
}

export interface VirtualMachineSmartMount {
  enabled: boolean;
  "Removable drives": string;
  "CD/DVD drives": string;
  "Network shares": string;
}

export interface VirtualMachineStartupAndShutdown {
  Autostart: string;
  "Autostart delay": number;
  Autostop: string;
  "Startup view": string;
  "On shutdown": string;
  "On window close": string;
  "Pause idle": string;
  "Undo disks": string;
}

export interface VirtualMachineTimeSynchronization {
  enabled: boolean;
  "Smart mode": string;
  "Interval (in seconds)": number;
  "Timezone synchronization disabled": string;
}

export interface VirtualMachineTravelMode {
  "Enter condition": string;
  "Enter threshold": number;
  "Quit condition": string;
}

export interface VirtualMachineUSBAndBluetooth {
  "Automatic sharing cameras": string;
  "Automatic sharing bluetooth": string;
  "Automatic sharing smart cards": string;
  "Automatic sharing gamepads": string;
  "Support USB 3.0": string;
}