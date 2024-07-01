import config from "../config/config.json";

class IConfig {
    deleteSpecialSlotContents: boolean;
    deleteSecureContainerContents: boolean;
    exemptItems: string[];
}

export const CONFIG: IConfig = config;
