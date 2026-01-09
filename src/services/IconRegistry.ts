// This file manages all icon imports in one place
import PlusIcon from '../assets/icons/Add.svg';
import ChatIcon from '../assets/icons/Chat.svg';
import CleanIcon from '../assets/icons/Clean.svg';
import ExportIcon from '../assets/icons/Export.svg';
import LogIcon from '../assets/icons/Log.svg';
import NotificationIcon from '../assets/icons/Notification.svg';
import PauseIcon from '../assets/icons/Pause.svg';
import ResetIcon from '../assets/icons/Reset.svg';
import RestartIcon from '../assets/icons/Restart.svg';
import RunIcon from '../assets/icons/Run.svg';
import SendIcon from '../assets/icons/Send.svg';
import CogIcon from '../assets/icons/Settings.svg';
import ShopIcon from '../assets/icons/Shop.svg';
import StopIcon from '../assets/icons/Stop.svg';
import SuspendIcon from '../assets/icons/Suspend.svg';
import BugIcon from '../assets/icons/Bug.svg';
import CloseIcon from '../assets/icons/Close.svg';
import CheckCircleIcon from '../assets/icons/CheckCircle.svg';
import TrashIcon from '../assets/icons/Trash.svg';
import ArrowDownIcon from '../assets/icons/ArrowDown.svg';
import ArrowUpIcon from '../assets/icons/ArrowUp.svg';
import DownloadIcon from '../assets/icons/Download.svg';
import OfficialIcon from '../assets/icons/Official.svg';
import AttachmentIcon from '../assets/icons/Attachment.svg';
import ImageIcon from '../assets/icons/Image.svg';
import ErrorIcon from '../assets/icons/Error.svg';
import InfoIcon from '../assets/icons/Info.svg';
import GlobeIcon from '../assets/icons/Globe.svg';
import DockerIcon from '../assets/icons/Docker.svg';
import ViewGridIcon from '../assets/icons/ViewGrid.svg';
import ViewRowsIcon from '../assets/icons/ViewRows.svg';
import ContainerIcon from '../assets/icons/Container.svg';
import OpenAppIcon from '../assets/icons/OpenApp.svg';
import DotsIcon from '../assets/icons/Dots.svg';
import HelpIcon from '../assets/icons/Help.svg';
import ReportFeedbackIcon from '../assets/icons/ReportFeedback.svg';
import PraiseIcon from '../assets/icons/Praise.svg';
import IdeaIcon from '../assets/icons/Idea.svg';
import UXIcon from '../assets/icons/UX.svg';
import BackIcon from '../assets/icons/Back.svg';
import DetailsIcon from '../assets/icons/Details.svg';
import ArrowLeftIcon from '../assets/icons/ArrowLeft.svg';
import ArrowRightIcon from '../assets/icons/ArrowRight.svg';
import SaveIcon from '../assets/icons/Save.svg';
import SunIcon from '../assets/icons/Sun.svg';
import MoonIcon from '../assets/icons/Moon.svg';
import ThemeLightIcon from '../assets/icons/ThemeLight.svg';
import ThemeDarkIcon from '../assets/icons/ThemeDark.svg';
import ThemeAutoIcon from '../assets/icons/ThemeAuto.svg';
import SearchIcon from '../assets/icons/Search.svg';
import StarIcon from '../assets/icons/Star.svg';
import VerifiedIcon from '../assets/icons/Verified.svg';
import CopyClipboardIcon from '../assets/icons/CopyClipboard.svg';
import EyeOpenIcon from '../assets/icons/EyeOpen.svg';
import EyeClosedIcon from '../assets/icons/EyeClosed.svg';
import type { IconName } from '@/types/Icon';
import { ReactNode } from 'react';

export type ReactNodeNoString = Exclude<ReactNode, string>;

// Registry of all available icons with proper typing
export const iconRegistry: Record<IconName, string> = {
  Plus: PlusIcon,
  Clean: CleanIcon,
  Chat: ChatIcon,
  Export: ExportIcon,
  Log: LogIcon,
  Notification: NotificationIcon,
  Pause: PauseIcon,
  Reset: ResetIcon,
  Restart: RestartIcon,
  Run: RunIcon,
  Send: SendIcon,
  Cog: CogIcon,
  Shop: ShopIcon,
  Stop: StopIcon,
  Suspend: SuspendIcon,
  Bug: BugIcon,
  Close: CloseIcon,
  CheckCircle: CheckCircleIcon,
  Trash: TrashIcon,
  ArrowDown: ArrowDownIcon,
  ArrowUp: ArrowUpIcon,
  Download: DownloadIcon,
  Official: OfficialIcon,
  Attachment: AttachmentIcon,
  Image: ImageIcon,
  Error: ErrorIcon,
  Info: InfoIcon,
  Globe: GlobeIcon,
  Docker: DockerIcon,
  ViewGrid: ViewGridIcon,
  ViewRows: ViewRowsIcon,
  Container: ContainerIcon,
  OpenApp: OpenAppIcon,
  Dots: DotsIcon,
  Help: HelpIcon,
  ReportFeedback: ReportFeedbackIcon,
  Praise: PraiseIcon,
  Idea: IdeaIcon,
  UX: UXIcon,
  Back: BackIcon,
  Details: DetailsIcon,
  ArrowLeft: ArrowLeftIcon,
  ArrowRight: ArrowRightIcon,
  Save: SaveIcon,
  Sun: SunIcon,
  Moon: MoonIcon,
  ThemeLight: ThemeLightIcon,
  ThemeDark: ThemeDarkIcon,
  ThemeAuto: ThemeAutoIcon,
  Search: SearchIcon,
  Star: StarIcon,
  Verified: VerifiedIcon,
  CopyClipboard: CopyClipboardIcon,
  EyeOpen: EyeOpenIcon,
  EyeClosed: EyeClosedIcon,
};

// Raw SVG content cache
const svgContentCache: Record<string, string> = {};

// SVG content handling function
function processSvgContent(name: string, content: string): string {
  // Step 1: Check if content is Base64 encoded
  const isBase64 = /^[A-Za-z0-9+/=]+$/.test(content.trim());

  let decodedContent = content;

  if (isBase64) {
    try {
      // Decode Base64
      decodedContent = atob(content);
    } catch (error) {
      console.error(`[${name}] Failed to decode Base64 content:`, error);
    }
  }

  // Step 2: Clean up the content - remove any leading/trailing whitespace
  decodedContent = decodedContent.trim();

  // Step 3: Check if content is URL encoded (contains %20, %3c, etc.)
  const isUrlEncoded = /%[0-9a-fA-F]{2}/.test(decodedContent);

  if (isUrlEncoded) {
    try {
      decodedContent = decodeURIComponent(decodedContent);
    } catch (error) {
      console.error(`[${name}] Failed to URL decode content:`, error);
    }
  }

  // Step 4: More flexible SVG validation
  const hasSvgTag = /<svg[^>]*>/i.test(decodedContent);
  const hasClosingSvgTag = /<\/svg>/i.test(decodedContent);
  const hasValidSvgStructure = hasSvgTag && hasClosingSvgTag;

  if (!hasValidSvgStructure) {
    console.warn(
      `[${name}] Content does not appear to be valid SVG:`,
      decodedContent.substring(0, 100)
    );
  }

  return decodedContent;
}

/**
 * Fetch the raw SVG content from a URL
 */
const fetchSvgContent = async (name: string, url: string): Promise<string> => {
  if (svgContentCache[url]) {
    return svgContentCache[url];
  }

  try {
    if (url.startsWith('data:image/svg+xml')) {
      const base64ContentParts = url.split(',');
      // now we will join everything except the first part
      const base64Content = base64ContentParts.slice(1).join(',');

      if (!base64Content) {
        console.warn(`[${name}] No base64 content found in data URL`);
        return '';
      }

      // Check if content is URL encoded (contains %20, %3c, etc.)
      const isUrlEncoded = /%[0-9a-fA-F]{2}/.test(base64Content);

      if (isUrlEncoded) {
        try {
          // First URL decode, then process
          const encoded = base64Content.split(',')[1];
          let urlDecoded = '';
          if (encoded && encoded[0] === 'data:image/svg+xml') {
            urlDecoded = encoded;
          } else {
            urlDecoded = decodeURIComponent(base64Content);
          }
          const decodedContent = processSvgContent(name, urlDecoded);
          svgContentCache[url] = decodedContent;
          return decodedContent;
        } catch (e) {
          console.error(`[${name}] Failed to decode URL encoded SVG:`, e);
        }
      } else {
        try {
          // Process as regular base64 content
          const svgText = processSvgContent(name, base64Content);
          svgContentCache[url] = svgText;
          return svgText;
        } catch (e) {
          console.error(`[${name}] Failed to decode SVG data URL:`, e);
        }
      }
    }

    // For regular URLs, fetch as usual
    const response = await fetch(url);
    const svgText = await response.text();

    // More flexible SVG validation
    const hasSvgTag = /<svg[^>]*>/i.test(svgText);
    const hasClosingSvgTag = /<\/svg>/i.test(svgText);

    if (hasSvgTag && hasClosingSvgTag) {
      svgContentCache[url] = svgText;
      return svgText;
    } else {
      console.error(
        `[${name}] URL ${url} did not return valid SVG content:`,
        svgText.substring(0, 100)
      );
      return '';
    }
  } catch (err) {
    console.error(`[${name}] Failed to fetch SVG content from ${url}:`, err);
    return '';
  }
};

/**
 * Get icon information
 * @param name Icon name to retrieve
 * @returns Object with icon URL and methods to get raw SVG content
 */
export const getIcon = (
  name: IconName
): {
  url: string | null;
  isSvg: boolean;
  getSvgContent: () => Promise<string>;
} => {
  let url = iconRegistry[name] || null;
  const nameParts = url?.split('?');
  url = nameParts ? nameParts[0] : url;

  let isSvg = url
    ? url.toLowerCase().endsWith('.svg') ||
    url.includes('data:image/svg+xml') ||
    name.includes('data:image/svg+xml;base64')
    : false;

  if (name?.includes('data:image/svg+xml;base64')) {
    url = name;
    isSvg = true;
  }

  return {
    url,
    isSvg,
    getSvgContent: async () => {
      if (!url || !isSvg) {
        return '';
      }

      try {
        const content = await fetchSvgContent(name, url);
        return content;
      } catch (err) {
        console.error(`Failed to get SVG content for ${name}:`, err);
        return '';
      }
    },
  };
};
