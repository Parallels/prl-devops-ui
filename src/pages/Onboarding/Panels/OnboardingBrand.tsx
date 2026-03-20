import React from 'react';
import parallelsBars from '../../../assets/images/parallels-bars-small.png';

export const OnboardingBrand: React.FC = () => (
  <div className="flex items-center justify-center pb-2 pt-3 p-5">
    <div className="flex items-center">
      <div className="h-8 w-8 flex items-center justify-center">
        <img className="h-full" src={parallelsBars} alt="Parallels DevOps" />
      </div>
      <div className="flex items-start font-medium ml-2.5 text-xl">
        <span className="text-[#6c757d] dark:text-neutral-400 pr-1.5">Parallels</span>
        <span className="text-gray-900 dark:text-gray-300">DevOps</span>
      </div>
    </div>
  </div>
);

export const OnboardingPanelBrand: React.FC = () => (
  <div className="flex items-center gap-2">
    <div className="h-3 w-3 flex items-center justify-center">
      <img className="w-full" src={parallelsBars} alt="Parallels" />
    </div>
    <div className="flex items-start text-base font-medium">
      <span className="pr-1 text-[#6c757d] dark:text-neutral-400">Parallels</span>
      <span className="text-neutral-900 dark:text-neutral-200">DevOps</span>
    </div>
  </div>
);
