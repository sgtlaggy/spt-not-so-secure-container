import { DependencyContainer } from "tsyringe";

import { IPreAkiLoadMod } from "@spt-aki/models/external/IPreAkiLoadMod";
import { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import { DatabaseServer } from "@spt-aki/servers/DatabaseServer";
import { InRaidHelper } from "@spt-aki/helpers/InRaidHelper";
import { InventoryHelper } from "@spt-aki/helpers/InventoryHelper";

import { CONFIG } from "./config";


class Mod implements IPreAkiLoadMod {
    public preAkiLoad(container: DependencyContainer): void {
        const logger = container.resolve<ILogger>("WinstonLogger");

        function includesItemOrParents(arr: string[], tpl: string) {
            const databaseServer = container.resolve<DatabaseServer>("DatabaseServer");
            const items = databaseServer.getTables().templates.items;
            let item = items[tpl];

            do {
                if (arr.includes(item._id)) {
                    return true;
                }
                item = items[item._parent];
            } while (item);
        }

        const deleteFrom: string[] = [];
        if (CONFIG.deleteSecureContainerContents) { deleteFrom.push("secure container"); }
        if (CONFIG.deleteSpecialSlotContents) { deleteFrom.push("special slots"); }

        if (deleteFrom.length > 0) {
            logger.info(`[NotSoSecureContainer] Patching to delete items from ${deleteFrom.join(" and ")} on death.`);

            container.afterResolution("InRaidHelper", (_t, inRaidHelper: InRaidHelper) => {
                const original = inRaidHelper.deleteInventory;

                inRaidHelper.deleteInventory = (pmcData, sessionId) => {
                    const inventoryHelper = container.resolve<InventoryHelper>("InventoryHelper");

                    const items = pmcData.Inventory.items;
                    const secureContainer = items.find((i) => (i.slotId === "SecuredContainer"));

                    items.filter((i) =>
                    (!includesItemOrParents(CONFIG.exemptItems, i._tpl)
                        && ((CONFIG.deleteSecureContainerContents &&
                            secureContainer && (i.parentId === secureContainer._id))
                            // setting LostOnDeath config didn't work, so doing it here
                            || (CONFIG.deleteSpecialSlotContents
                                && i.slotId?.startsWith("SpecialSlot")))))
                        .forEach((i) => inventoryHelper.removeItem(pmcData, i._id, sessionId));

                    original.call(inRaidHelper, pmcData, sessionId);
                };
            }, { frequency: "Always" });
        }

    }
}

export const mod = new Mod();
