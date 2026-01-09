import { ReactElement } from "react";

export type IconName = string | ReactElement;
export const getIcon = (_name: IconName) => ({
    isSvg: false,
    url: '',
    getSvgContent: async () => ''
});
