import { DependencyContainer } from "tsyringe";

import { InRaidHelper } from "@spt/helpers/InRaidHelper";
import { InventoryHelper } from "@spt/helpers/InventoryHelper";
import { BaseClasses } from "@spt/models/enums/BaseClasses";
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
                    const db = container.resolve<DatabaseService>("DatabaseService");
                    const dbItems = db.getItems();

                    const items = pmcData.Inventory.items;
                    const secureContainer = items.find((i) => (i.slotId === "SecuredContainer"));

                    const deleteAll = randomUtil.getChance100(CONFIG.deletionChanceAll);

                    // get immediate items in configured slots
                    const itemsAtRisk = items.filter((i) =>
                    (((CONFIG.deleteSecureContainerContents &&
                        secureContainer && (i.parentId === secureContainer._id))
                        // setting LostOnDeath config didn't work, so doing it here
                        || (CONFIG.deleteSpecialSlotContents
                            && i.slotId?.startsWith("SpecialSlot")))));

                    // get all items nested within configured slots
                    // this should loop 1 + N of containers nested in covered slots
                    let lastDepth = itemsAtRisk;
                    let updated = false;
                    do {
                        updated = false;
                        const toAdd = items.filter(
                            (i) => (lastDepth.some(
                                (p) => (p._id === i.parentId))));
                        if (toAdd.length > 0) {
                            updated = true;
                            itemsAtRisk.push(...toAdd);
                            lastDepth = toAdd;
                        }
                    } while (updated);

                    // split exempt and deletable items
                    const exempt = [];
                    const toDelete = [];
                    itemsAtRisk.forEach((i) => {
                        if (includesItemOrParents(CONFIG.exemptItems, i._tpl)) {
                            // exempt all parent containers of exempt items
                            // for example, don't delete an LBCR containing an exempt injector case
                            let parent = i;
                            do {
                                exempt.push(parent);
                                parent = itemsAtRisk.find((p) => (p._id === parent.parentId));
                            } while (parent !== undefined);
                        } else if (!((i.slotId === "cartridges") // ammo in boxes/mags
                            || (dbItems[i._tpl]._parent === BaseClasses.BUILT_IN_INSERTS))) { // soft armor
                            toDelete.push(i);
                        }
                    });

                    toDelete.filter((i) =>
                    (!exempt.includes(i)
                        && (deleteAll
                            || randomUtil.getChance100(CONFIG.deletionChanceIndividual))))
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
            if (item._parent === BaseClasses.MOB_CONTAINER) {
                props.Grids?.forEach((grid) => { grid._props.filters = [] });
            }
        }
    }
}

export const mod = new Mod();
