import config from "../config/config.json";

class IConfig {
    deleteSpecialSlotContents: boolean;
    deleteSecureContainerContents: boolean;
    removeSecureContainerFilter: boolean;
    deletionChanceAll: number;
    deletionChanceIndividual: number;
    exemptItems: string[];
}

export const CONFIG: IConfig = config;
