import { DependencyContainer } from "tsyringe";

import { InRaidHelper } from "@spt/helpers/InRaidHelper";
import { InventoryHelper } from "@spt/helpers/InventoryHelper";
import { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import { IPreSptLoadMod } from "@spt/models/external/IPreSptLoadMod";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { DatabaseService } from "@spt/services/DatabaseService";
import { RandomUtil } from "@spt/utils/RandomUtil";

import { CONFIG } from "./config";


class Mod implements IPreSptLoadMod, IPostDBLoadMod {
    public preSptLoad(container: DependencyContainer): void {
        const logger = container.resolve<ILogger>("WinstonLogger");
        const randomUtil = container.resolve<RandomUtil>("RandomUtil");

        function includesItemOrParents(arr: string[], tpl: string) {
            const db = container.resolve<DatabaseService>("DatabaseService");
            const items = db.getItems();
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

        if (deleteFrom.length && (CONFIG.deletionChanceAll || CONFIG.deletionChanceIndividual)) {
            logger.info(`[NotSoSecureContainer] Patching to delete items from ${deleteFrom.join(" and ")} on death.`);

            container.afterResolution("InRaidHelper", (_t, inRaidHelper: InRaidHelper) => {
                const original = inRaidHelper.deleteInventory;

                inRaidHelper.deleteInventory = (pmcData, sessionId) => {
                    const inventoryHelper = container.resolve<InventoryHelper>("InventoryHelper");

                    const items = pmcData.Inventory.items;
                    const secureContainer = items.find((i) => (i.slotId === "SecuredContainer"));

                    const deleteAll = randomUtil.getChance100(CONFIG.deletionChanceAll);

                    items.filter((i) =>
                    (((CONFIG.deleteSecureContainerContents &&
                        secureContainer && (i.parentId === secureContainer._id))
                        // setting LostOnDeath config didn't work, so doing it here
                        || (CONFIG.deleteSpecialSlotContents
                            && i.slotId?.startsWith("SpecialSlot")))
                        && (deleteAll || randomUtil.getChance100(CONFIG.deletionChanceIndividual))
                        && !includesItemOrParents(CONFIG.exemptItems, i._tpl)))
                        .forEach((i) => inventoryHelper.removeItem(pmcData, i._id, sessionId));

                    original.call(inRaidHelper, pmcData, sessionId);
                };
            }, { frequency: "Always" });
        }
    }

    postDBLoad(container: DependencyContainer): void {
        if (!CONFIG.removeSecureContainerFilter) {
            return;
        }

        const logger = container.resolve<ILogger>("WinstonLogger");
        const db = container.resolve<DatabaseService>("DatabaseService");
        const items = db.getItems();

        logger.info("[NotSoSecureContainer] Allowing all items in secure containers.")

        for (const item of Object.values(items)) {
            const props = item._props;
            if (item._parent === "5448bf274bdc2dfc2f8b456a") {
                props.Grids?.forEach((grid) => { grid._props.filters = [] });
            }
        }
    }
}

export const mod = new Mod();
