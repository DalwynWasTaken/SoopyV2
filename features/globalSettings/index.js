/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />
import Feature from "../../featureClass/class";
import ButtonSetting from "../settings/settingThings/button";
import TextSetting from "../settings/settingThings/textSetting";
import ToggleSetting from "../settings/settingThings/toggle";
import HudTextElement from "../hud/HudTextElement";
import LocationSetting from "../settings/settingThings/location";
import firstLoadPages from "./firstLoadPages";
import GuiPage from "../soopyGui/GuiPage"
import Notification from "../../../guimanager/Notification";
import logger from "../../logger";
import { numberWithCommas } from "../../utils/numberUtils";
import { firstLetterCapital } from "../../utils/stringUtils";
import { fetch } from "../../utils/networkUtils";
import socketConnection from "../../socketConnection";
import renderLibs from "../../../guimanager/renderLibs";
import { f, m } from "../../../mappings/mappings";
import { addLore, getSBUUID, toMessageWithLinks } from "../../utils/utils";
import { delay } from "../../utils/delayUtils";
const Files = Java.type("java.nio.file.Files")
const Paths = Java.type("java.nio.file.Paths")
const JavaString = Java.type("java.lang.String")
const JavaLong = Java.type("java.lang.Long")

let hecatombLevels = [2, 5, 10, 20, 30, 40, 60, 80, 100]
let championLevels = [50000, 100000, 250000, 500000, 1000000, 1500000, 2000000, 2500000, 3000000]

class GlobalSettings extends Feature {
    constructor() {
        super()

        this.initVariables()
    }

    initVariables() {
        this.apiKeySetting = undefined
        this.GuiPage = undefined
    }

    onEnable() {
        this.apiKeySetting = new TextSetting("Api Key", "Your hypixel api key", "", "api_key", this, "Run /api new to load", true)
        this.verifyApiKey = new ButtonSetting("Verify api key", "Click this to make sure the api key is working", "verify_key", this, "Click!", this.verifyKey2, undefined)
        this.newApiKey = new ButtonSetting("Run /api new", "This is here so u dont need to exit and re-enter", "api_new_command", this, "Click!", this.apiNewCommand, undefined)
        this.findApiKey = new ButtonSetting("Attempt to load api key from other mods", "This will scan other mods configs to attempt to find your key", "find_key", this, "Click!", () => { this.findKey() }, undefined)

        this.alertAllUpdates = new ToggleSetting("Send chat update avalible for all updates", "If disabled itll notify for new updates less", false, "alert_all_updates", this)

        this.fixNeuNetworth = new ToggleSetting("Change networth in NEU pv to soopynw", "This should make it a lot more accurate", true, "neu_nw_override", this)
        this.darkTheme = new ToggleSetting("Dark theme", "This might be scuffed because guis are still made in light theme", false, "dark_theme", this)
        // this.linkPreview = new ToggleSetting("Link preview", "Shows a preview of where a link will take you", true, "link_preview", this)

        // this.reportErrorsSetting = new ToggleSetting("Send module errors to soopy server", "This will allow me to more effectivly fix them", false, "privacy_send_errors", this)

        this.hideFallingBlocks = new ToggleSetting("Hide falling blocks", "NOTE: This setting is a bit laggy", false, "hide_falling_sand", this)
        this.twitchCommands = new ToggleSetting("Ingame twitch bot commands", "Allows u to use twitch bot commands ingame (eg -sa)", true, "twitch_commands_ingame", this)
        this.handChat = new ToggleSetting("Replace [hand] with ur currently held item", "Idea from Synthesis im only adding cus i dont have D:", true, "hand_chat", this)
        this.itemWorth = new ToggleSetting("(Approximate) Item worth in lore", "Accounts for stuff like enchants/recombs ect", false, "item_worth", this)
        this.showHecatomb = new ToggleSetting("Show hecatomb enchant info in lore", "", true, "show_hecatomb", this)
        this.showChampion = new ToggleSetting("Show champion enchant info in lore", "", true, "show_champion", this)

        this.thunderBottle = new ToggleSetting("Thunder Bottle Progress Display", "shows you the progress of thunder bottle in your inventory", false, "thunder_bottle", this);
        this.thunderBottleElement = new HudTextElement()
            .setText("")
            .setToggleSetting(this.thunderBottle)
            .setLocationSetting(new LocationSetting("Thunder Bottle Progress location", "Allows you to change location of this display", "thunder_bottle_location", this, [20, 100, 1, 1]).requires(this.thunderBottle).editTempText(`&6Thunder Charge&7> &f49,999&7/&750,000`));
        this.hudElements.push(this.thunderBottleElement);
        this.thunderBottleFull = new ToggleSetting("Thunder Bottle Full Alert", "Alert when your thunder bottle is fully charged", false, "thunder_bottle_full", this);

        this.oldMasterStars = new ToggleSetting("Use Old Master Stars", "replaces the ugly new master star on item name with the old fashion one", false, "old_master_star", this)
        this.sbaItemPickUpLog = new ToggleSetting("Sba Item Pick Up Log", "Same as sba item pick up log, but fixes old master stars making it go brrr", false, "sba_item_log", this);
        this.sbaItemPickUpLogElement = new HudTextElement()
            .setText("")
            .setToggleSetting(this.sbaItemPickUpLog)
            .setLocationSetting(new LocationSetting("Sba Item Pick Up Log location", "Allows you to change location of this display", "sba_item_log_location", this, [10, 100, 1, 1]).requires(this.sbaItemPickUpLog).editTempText(`&a+ 1x &dHeroic Hyperion &c✪✪✪✪✪\n&c- 1x &dHeroic Hyperion &6✪✪✪✪✪`));
        this.hudElements.push(this.sbaItemPickUpLogElement);
        this.maxAmount = new TextSetting("Pickup Log Line Limit", "Basically after this length it doesn't log anymore", "20", "item_log_max_amount", this, "20", false).requires(this.sbaItemPickUpLog);

        this.fancyVanquisherAlert = new ToggleSetting("Fancy Vanquisher Alert", "Alert when a Vanquisher spawned", false, "fancy_vanquisher_alert", this);
        this.fancySeaCreaturesAlert = new ToggleSetting("Fancy Sea Creatures Alert", "Alert when you caught x creature (this is the main toggle)", false, "fancy_sc_alert", this);
        this.fancySeaCreaturesAlertThunder = new ToggleSetting("Fancy Thunder Alert", "Alert when you caught Thunder creature", false, "fancy_thunder_alert", this).requires(this.fancySeaCreaturesAlert);
        this.fancySeaCreaturesAlertJawbus = new ToggleSetting("Fancy Jawbus Alert", "Alert when you caught Lord Jawbus creature", false, "fancy_jawbus_alert", this).requires(this.fancySeaCreaturesAlert);

        this.registerEvent('itemTooltip', (lore, i, e) => {
            if (!this.oldMasterStars.getValue()) return
            if (!i) return
            let itemName = i.getName()
            let itemNameReformat = itemName.removeFormatting()
            if (itemNameReformat.endsWith("➊")) {
                let newItemName = itemName.replace("§6✪§6✪§6✪§6✪§6✪§c➊", "§c✪§6✪✪✪✪")
                i.setName(newItemName)
                this.saveItemData(getSBUUID(i), newItemName)
                return
            }
            if (itemNameReformat.endsWith("➋")) {
                let newItemName = itemName.replace("§6✪§6✪§6✪§6✪§6✪§c➋", "§c✪✪§6✪✪✪")
                i.setName(newItemName)
                this.saveItemData(getSBUUID(i), newItemName)
                return
            }
            if (itemNameReformat.endsWith("➌")) {
                let newItemName = itemName.replace("§6✪§6✪§6✪§6✪§6✪§c➌", "§c✪✪✪§6✪✪")
                i.setName(newItemName)
                this.saveItemData(getSBUUID(i), newItemName)
                return
            }
            if (itemNameReformat.endsWith("➍")) {
                let newItemName = itemName.replace("§6✪§6✪§6✪§6✪§6✪§c➍", "§c✪✪✪✪§6✪")
                i.setName(newItemName)
                this.saveItemData(getSBUUID(i), newItemName)
                return
            }
            if (itemNameReformat.endsWith("➎")) {
                let newItemName = itemName.replace("§6✪§6✪§6✪§6✪§6✪§c➎", "§c✪✪✪✪✪")
                i.setName(newItemName)
                this.saveItemData(getSBUUID(i), newItemName)
                return
            }
        })

        this.registerEvent('worldLoad', this.worldLoad)

        this.itemData = {};
        this.oldItemData = {};
        this.initOldItemData();
        this.todoPickUpLog = {};
        this.clearLog = false;

        this.registerStep(true, 5, this.step5Fps)
        //4 chat registeries below prevents pickup log to go brrr when warping
        this.registerChat("&r&c ☠ ${info} and became a ghost&r&7.&r", (info, e) => {
            if (info.includes("You")) this.preventGoingBrrr();
        });
        this.registerChat("${info}You were revived by ${info2}", this.preventGoingBrrr);

        this.registerChat("&r&e> Your bottle of thunder has fully charged!&r", () => {
            if (this.thunderBottleFull.getValue()) {
                Client.showTitle("&6Bottle of Thunder Fully Charged", "", 0, 100, 10);
            }
        })

        this.registerStep(true, 4, this.mobThings)

        this.firstPageSettings = [this.darkTheme]

        this.firstLoadPageData = JSON.parse(FileLib.read("soopyAddonsData", "soopyv2firstloaddata.json") || "{}") || {}

        this.GuiPage = new FirstLoadingPage(this)

        // soopyV2Server.reportErrorsSetting = this.reportErrorsSetting
        this.registerEvent("itemTooltip", this.itemTooltipEvent).registeredWhen(() => this.itemWorth.getValue() || this.showChampion.getValue() || this.showHecatomb.getValue())


        this.registerChat("&aYour new API key is &r&b${key}&r", this.newKey)
        const EntityFallingBlock = Java.type("net.minecraft.entity.item.EntityFallingBlock");

        this.registerEvent('renderEntity', (entity, posVec, partialTicks, event) => {
            if (entity.getEntity() instanceof EntityFallingBlock) {
                cancel(event);
            }
        }).registeredWhen(() => this.hideFallingBlocks.getValue())

        this.ranFirstLoadThing = false

        if (!this.firstLoadPageData.shown) {
            new Thread(() => {
                while (!World.isLoaded() || !this.FeatureManager.finishedLoading) {
                    Thread.sleep(100)
                }
                Thread.sleep(500)
                this.showFirstLoadPage.call(this)
            }).start()
        }

        if (net.minecraftforge.fml.common.Loader.isModLoaded("notenoughupdates")) {
            this.GuiProfileViewer = Java.type("io.github.moulberry.notenoughupdates.profileviewer.GuiProfileViewer")
            this.currentPlayerOpen = undefined
            this.currentPlayerNetworth = {}
            this.registerEvent("tick", this.fixNEU)
        }

        this.requestingPrices = new Set()
        this.registerStep(false, 1, this.updateItemLores)

        try { //This enables links from soopy.dev to be shown in patcher image preview
            let hasHost = false

            for (let host of Java.type("gg.essential.util.TrustedHostsUtil").INSTANCE.getTrustedHosts()) {
                if (host.getName() === "soopy.dev") {
                    hasHost = true
                }
            }

            if (!hasHost) {
                let TrustedHost = Java.type("gg.essential.api.utils.TrustedHostsUtil").TrustedHost
                let TreeSet = Java.type("java.util.TreeSet")
                let hosts = new TreeSet()
                hosts.add("soopy.dev")

                let host = new TrustedHost(124123, "soopy.dev", hosts)

                Java.type("gg.essential.util.TrustedHostsUtil").INSTANCE.addTrustedHost(host)
            }
        } catch (e) { }

        this.registerCommand("soopyweight", (user = Player.getName()) => {
            this.soopyWeight(user)
        })
        this.registerCommand("sweight", (user = Player.getName()) => {
            this.soopyWeight(user)
        })
        this.registerCommand("lobbyday", () => {
            ChatLib.chat(this.FeatureManager.messagePrefix + "Current lobby is day " + (World.getTime() / 20 / 60 / 20).toFixed(2))
        })
        this.registerCommand("tps", (time = "3") => {
            time = parseInt(time)
            ChatLib.chat(this.FeatureManager.messagePrefix + "Loading tps... this will take " + time + "s")

            let packetMoves = 0
            let ticks = 0
            let packetReceived = register("packetReceived", () => {
                packetMoves++
            })

            let tick = register("tick", () => {
                if (packetMoves > 0) ticks++
                packetMoves = 0
            })

            delay(time * 1000, () => {
                packetReceived.unregister()
                tick.unregister()
                ChatLib.chat(this.FeatureManager.messagePrefix + "Tps: " + (ticks / time).toFixed(1))
            })
        })

        this.lastCookies = 0

        this.registerEvent("postGuiRender", () => {
            if (Player.getContainer() && Player.getContainer().getName() === "Cookie Clicker v0.01" && Player.getContainer().getStackInSlot(13)) this.renderCookie()
            // if (this.linkPreview.getValue() && Client.currentGui && Client.currentGui.get() && Client.currentGui.get().toString().startsWith("net.minecraft.client.gui.GuiConfirmOpenLink")) this.renderWebpage()
        })
        this.registerStep(false, 1, () => {
            if (Player.getContainer() && Player.getContainer().getName() === "Cookie Clicker v0.01" && Player.getContainer().getStackInSlot(13)) this.tickCookie()

            global.guiManagerSoopyGuisSetDarkThemeEnabled(this.darkTheme.getValue())
        })

        this.registerEvent("guiMouseClick", this.guiClicked)

        this.partyChatEnabled = true

        this.registerChat("&r&9Party &8> ${*}", (e) => {
            if (!this.partyChatEnabled) {
                cancel(e)
            }
        })

        this.registerEvent("messageSent", (message, event) => {
            if (this.twitchCommands.getValue() && message.startsWith("-") && message[1].toLowerCase().match(/[a-z]/)) {
                cancel(event)
                ChatLib.addToSentMessageHistory(message)
                fetch("http://soopy.dev/api/soopyv2/botcommand?m=" + encodeURIComponent(message.replace("-", "")) + "&u=" + Player.getName()).text(text => {
                    ChatLib.chat(this.FeatureManager.messagePrefix + "&7" + message)
                    toMessageWithLinks(this.FeatureManager.messagePrefix + text, "7").chat()
                })
                return;
            }

            if (this.handChat.getValue() && message.toLowerCase().includes("[hand]")) {
                cancel(event)
                ChatLib.addToSentMessageHistory(message)

                fetch("http://soopy.dev/api/soopyv2/itemup", {
                    postData: {
                        name: Player.getHeldItem().getName(),
                        lore: Player.getHeldItem().getLore().join("\n")
                    }
                }).text(text => {
                    if (text.length > 20) {
                        ChatLib.chat(this.FeatureManager.messagePrefix + "There was an error uploading the item data!")
                        return
                    }

                    ChatLib.say(message.replace(/\[hand\]/gi, "[ITEM:" + text + "]"))
                })
                return;
            }
        })

        let ev = this.registerChat("${*}[ITEM:${*}", (event) => {
            cancel(event)
            let message = new Message(event)

            let [_] = message.getUnformattedText().match(/\[ITEM:([0-9]+)\]/g)
            let id = _.replace("[ITEM:", "").replace(/\]$/g, "")

            fetch("http://soopy.dev/api/soopyv2/itemdown/" + id).json(([name, lore]) => {
                for (let i = 0; i < message.getMessageParts().length; i++) {
                    let component = message.getMessageParts()[i]

                    if (component.getText().match(/\[ITEM:([0-9]+)\]/g)) {
                        let [_] = component.getText().match(/\[ITEM:([0-9]+)\]/g)
                        let id = _.replace("[ITEM:", "").replace(/\]$/g, "")

                        message.setTextComponent(i, new TextComponent(component.getText().replace("[ITEM:" + id + "]", name + "&r")).setHover("show_text", lore))
                    }
                }
                message.setRecursive(true)
                message.chat()
            }).error(() => {
                ChatLib.chat(this.FeatureManager.messagePrefix + "There was an error downloading the item data!")
                message.chat()
            })

        })
        ev.trigger.setPriority(Priority.HIGHEST)
    }

    worldLoad() {
        this.requestingPrices.clear();
        this.initOldItemData();
        this.preventGoingBrrr();
        if (!this.oldMasterStars.getValue()) return
        let j = 0;
        [...Player.getInventory().getItems()].forEach(i => {
            j++;
            if (j > 8) return //only do the 1-8 hot bar slots
            if (!i) return
            let itemName = i.getName()
            let itemNameReformat = itemName.removeFormatting()
            if (itemNameReformat.endsWith("➊")) {
                let newItemName = itemName.replace("§6✪§6✪§6✪§6✪§6✪§c➊", "§c✪§6✪✪✪✪")
                i.setName(newItemName)
                this.saveItemData(getSBUUID(i), newItemName)
                return
            }
            if (itemNameReformat.endsWith("➋")) {
                let newItemName = itemName.replace("§6✪§6✪§6✪§6✪§6✪§c➋", "§c✪✪§6✪✪✪")
                i.setName(newItemName)
                this.saveItemData(getSBUUID(i), newItemName)
                return
            }
            if (itemNameReformat.endsWith("➌")) {
                let newItemName = itemName.replace("§6✪§6✪§6✪§6✪§6✪§c➌", "§c✪✪✪§6✪✪")
                i.setName(newItemName)
                this.saveItemData(getSBUUID(i), newItemName)
                return
            }
            if (itemNameReformat.endsWith("➍")) {
                let newItemName = itemName.replace("§6✪§6✪§6✪§6✪§6✪§c➍", "§c✪✪✪✪§6✪")
                i.setName(newItemName)
                this.saveItemData(getSBUUID(i), newItemName)
                return
            }
            if (itemNameReformat.endsWith("➎")) {
                let newItemName = itemName.replace("§6✪§6✪§6✪§6✪§6✪§c➎", "§c✪✪✪✪✪")
                i.setName(newItemName)
                this.saveItemData(getSBUUID(i), newItemName)
                return
            }
        })
    }

    step5Fps() {
        let old = this.oldMasterStars.getValue();
        let pick = this.sbaItemPickUpLog.getValue();
        let thunder = this.thunderBottle.getValue();
        let max = this.maxAmount.getValue();
        if (max) {
            max = Number(max)
            if (max < 0 || isNaN(max)) this.maxAmount.setValue("0");
        }
        let inGui = Client.isInGui()
        if (!old && !pick && !thunder) return
        if (inGui) {
            this.todoPickUpLog = {};
        }
        let j = 0;
        let now = Date.now();
        let thunderText = [];
        [...Player.getInventory().getItems()].forEach(i => {
            j++;
            if (i) {
                let uuid = getSBUUID(i)
                let ItemName = i.getName()
                if (old) {
                    if (uuid && this.itemData.hasOwnProperty(uuid)) {
                        let newName = this.itemData[uuid]
                        if (ItemName != newName) {
                            i.setName(newName)
                        }
                    }
                }
                if (thunder) {
                    if (ItemName.removeFormatting().includes("Empty Thunder Bottle")) {
                        let charges = i?.getNBT()?.getCompoundTag("tag")?.getCompoundTag("ExtraAttributes")?.getDouble("thunder_charge")
                        thunderText.push(`&6Thunder Charge&7> &f${numberWithCommas(charges)}&7/&750,000`)
                    }
                }
            }
            if (pick && !inGui) {
                let oldItem = this.oldItemData[j]
                let newItem = i
                if (!oldItem && !newItem) return //they both are air
                if (j > 36 || j == 9) return //sbmenu and armors (when switching wardrobe it goes brrr w/o this)
                let oldItemAmount = oldItem ? oldItem.getNBT().getDouble("Count") : undefined
                let oldItemName = oldItem ? oldItem.getName().replace(/ §8x\d+$/, "") : ""
                let newItemAmount = newItem ? newItem.getNBT().getDouble("Count") : undefined
                let newItemName = newItem ? newItem.getName().replace(/ §8x\d+$/, "") : ""
                this.oldItemData[j] = newItem
                if (oldItemName === newItemName) { //only amount is changed
                    if (oldItemAmount === newItemAmount || !newItemAmount || !oldItemAmount) return
                    this.addToTodoPickUpLog(now, oldItemName, newItemAmount - oldItemAmount)
                    return //so it doesn't provide duplicate message
                }
                let olduuid = getSBUUID(oldItem)
                let newuuid = getSBUUID(newItem)
                if (oldItemAmount == 1 && olduuid == newuuid) return // fixes using old master star making sba go brrr
                if (oldItemName) { //thing removed from that inventory slot
                    if (!oldItemAmount) return
                    this.addToTodoPickUpLog(now, oldItemName, (-1) * oldItemAmount)
                }
                if (newItemName) { //thing being placed into that inventory slot
                    if (!newItemAmount) return
                    this.addToTodoPickUpLog(now, newItemName, newItemAmount)
                }
            }
        })
        if (thunder) {
            if (thunderText.length > 0) {
                this.thunderBottleElement.setText(thunderText.join("\n"))
            } else {
                this.thunderBottleElement.setText("")
            }
        }
        let todoText = [];
        if (pick) {
            Object.keys(this.todoPickUpLog).forEach((i) => {
                if (Math.abs(this.todoPickUpLog[i].timeStamp - now) > 5000 || !this.todoPickUpLog[i].Amount || this.todoPickUpLog[i].Amount == 0) {
                    delete this.todoPickUpLog[i]
                    return
                }
                //positive and negative prefix colors
                if (todoText.length < max) todoText.push((this.todoPickUpLog[i].Amount > 0 ? "&r&a+ " : "&r&c- ") + Math.abs(this.todoPickUpLog[i].Amount) + "x &f" + i)
            })
        } else {
            this.todoPickUpLog = {};
        }
        // doesn't need to put setText() in if (pick) cuz if (!pick) it clears the todo log list
        this.sbaItemPickUpLogElement.setText((inGui || this.clearLog) ? "" : (todoText.join("\n")))
    }

    mobThings() {
        if (!this.fancyVanquisherAlert.getValue()) return
        World.getAllEntitiesOfType(net.minecraft.entity.item.EntityArmorStand).forEach(entity => {
            let name = entity.getName()
            if (name.includes("'s")) return
            let LowerName = name.removeFormatting().toLowerCase()
            let existedTicks = entity.getTicksExisted()
            if (this.fancyVanquisherAlert.getValue()) {
                if (LowerName.includes("vanq")) {
                    if (existedTicks <= 20) {
                        Client.showTitle("&r&5&l[&b&l&kO&5&l] VANQUISHER &5[&b&l&kO&5&l]", "", 0, 50, 10);
                    }
                }
            }
            if (this.fancySeaCreaturesAlertThunder.getValue()) {
                if (LowerName.includes("thunder")) {
                    if (existedTicks <= 20) {
                        Client.showTitle("&r&6&l[&b&l&kO&6&l] THUNDER [&b&l&kO&6&l]", "", 0, 50, 10)
                    }
                }
            }
            if (this.fancySeaCreaturesAlertJawbus.getValue()) {
                if (LowerName.includes("jawbus")) {
                    if (existedTicks <= 20) {
                        Client.showTitle("&r&6&l[&b&l&kO&6&l] LORD JAWBUS [&b&l&kO&6&l]", "", 0, 50, 10)
                    }
                }
            }
        })
    }

    preventGoingBrrr() {
        this.clearLog = true
        delay(8000, () => {
            if (this.clearLog) {
                this.clearLog = false
            }
        })
    }

    itemTooltipEvent(lore, i, event) {
        let uuid = getSBUUID(i)
        if (!uuid) return

        if (this.itemWorth.getValue()) {
            let a = socketConnection.itemPricesCache.get(uuid)

            if (!a && socketConnection.itemPricesCache2.get(uuid)) {
                a = socketConnection.itemPricesCache2.get(uuid)
                socketConnection.itemPricesCache.set(uuid, a)
            }

            if (a) {
                addLore(i, "§eWorth: ", "§6$" + numberWithCommas(Math.round(a)))
            }
        }

        if (this.showChampion.getValue() && i?.getNBT()?.getCompoundTag("tag")?.getCompoundTag("ExtraAttributes")?.getDouble("champion_combat_xp")) {
            let xp = i?.getNBT()?.getCompoundTag("tag")?.getCompoundTag("ExtraAttributes")?.getDouble("champion_combat_xp")

            let level = 1
            championLevels.forEach(l => {
                if (xp >= l) level++
            })
            let xpNext = championLevels[level - 1]

            addLore(i, "§eChampion: ", "§d" + level + " §6" + numberWithCommas(Math.round(xp)) + (xpNext ? " §7/ §6" + numberWithCommas(Math.round(xpNext)) : ""))
        }
        if (this.showHecatomb.getValue() && i?.getNBT()?.getCompoundTag("tag")?.getCompoundTag("ExtraAttributes")?.getInteger("hecatomb_s_runs")) {
            let runs = i?.getNBT()?.getCompoundTag("tag")?.getCompoundTag("ExtraAttributes")?.getInteger("hecatomb_s_runs")

            let level = 1
            hecatombLevels.forEach(l => {
                if (runs >= l) level++
            })
            let xpNext = hecatombLevels[level - 1]

            addLore(i, "§eHecatomb: ", "§d" + level + " §6" + numberWithCommas(Math.round(runs)) + (xpNext ? " §7/ §6" + numberWithCommas(Math.round(xpNext)) : ""))
        }
    }

    updateItemLores() {
        if (!this.itemWorth.getValue()) return;

        if (!Player.getInventory()) return

        let items = [...Player.getInventory().getItems(), ...Player.getContainer().getItems()]

        items.forEach(i => {
            let uuid = getSBUUID(i)
            if (!uuid) return

            if (this.itemWorth.getValue()) {
                let a = socketConnection.itemPricesCache.get(uuid)

                if (!a && socketConnection.itemPricesCache2.get(uuid)) {
                    a = socketConnection.itemPricesCache2.get(uuid)
                    socketConnection.itemPricesCache.set(uuid, a)
                }

                if (!a) {
                    if (!this.requestingPrices.has(uuid)) {
                        this.requestingPrices.add(uuid)

                        let json = i.getNBT().toObject()
                        socketConnection.requestItemPrice(json, uuid)
                    }
                }

            }

        })
    }

    addToTodoPickUpLog(timestamp, itemname, amount) {
        let basicValue = 0
        if (this.todoPickUpLog[itemname]) {
            if (this.todoPickUpLog[itemname].Amount != 0) {
                basicValue = this.todoPickUpLog[itemname].Amount
            }
        }
        this.todoPickUpLog[itemname] = {
            timeStamp: timestamp,
            Amount: basicValue + amount
        }
    }

    initOldItemData() {
        let j = 0;
        [...Player.getInventory().getItems()].forEach(i => {
            j++;
            this.oldItemData[j] = i
        })
    }

    saveItemData(uuid, newName) {
        if (!this.itemData[uuid]) {
            this.itemData[uuid] = newName
        }
    }

    // renderWebpage() {
    //     let url = this.getField(Client.currentGui.get(), f.linkText)

    //     let image = renderLibs.getImage("https://soopy.dev/api/soopyv2/webpage?webpage=" + url)

    //     if (image) {
    //         let scale = Renderer.screen.getHeight() * 0.5 / image.getTextureHeight()
    //         image.draw(Renderer.screen.getWidth() / 2 - image.getTextureWidth() * scale / 2, Renderer.screen.getHeight() / 2, scale * image.getTextureWidth(), scale * image.getTextureHeight())
    //     } else {
    //         Renderer.drawString("Loading website preview...", Renderer.screen.getWidth() / 2 - Renderer.getStringWidth("Loading website preview...") / 2, Renderer.screen.getHeight() * 3 / 4)
    //     }
    // }

    guiClicked(mouseX, mouseY, button, gui, event) {
        if (gui.class.toString() === "class net.minecraft.client.gui.inventory.GuiChest" && Player.getContainer().getName() === "Cookie Clicker v0.01") {

            let hoveredSlot = gui.getSlotUnderMouse()
            if (!hoveredSlot) return

            let hoveredSlotId = hoveredSlot[f.slotNumber]

            // logger.logMessage(hoveredSlotId, 4)

            Player.getContainer().click(hoveredSlotId, false, "MIDDLE")
            cancel(event)
        }
    }

    tickCookie() {
        let cookies = parseInt(ChatLib.removeFormatting(Player.getContainer().getStackInSlot(13).getName().split(" ")[0]))

        let cookiesGained = cookies - this.lastCookies
        this.lastCookies = cookies
        if (cookiesGained > 50) cookiesGained = 0
        if (cookiesGained < 1) cookiesGained = 0
        if (!cookiesGained) cookiesGained = 0

        socketConnection.cookiesGained(cookiesGained)
    }

    renderCookie() {
        let cookies = parseInt(ChatLib.removeFormatting(Player.getContainer().getStackInSlot(13).getName().split(" ")[0]))

        let cookiesGained = cookies - this.lastCookies
        let cookieCount = socketConnection.cookieCount + ((cookiesGained < 50 && cookiesGained > 0) ? cookiesGained : 0)

        renderLibs.drawString("Lifetime Cookies: " + numberWithCommas(cookieCount), 10, 10, 1)

        if (socketConnection.cookieData) {
            // this.cookieData = {
            //     cookieLeaderboard: data.cookieLeaderboard,
            //     clickingNow: data.clickingNow
            // }

            let linesOfText = []

            linesOfText.push("---- CURRENTLY CLICKING ----")
            for (let data of socketConnection.cookieData.clickingNow) {
                linesOfText.push(data[0] + ": " + numberWithCommas(data[1]))

                if (linesOfText.length * 10 > Renderer.screen.getHeight() / 2) break
            }
            linesOfText.push("------- LEADERBOARD -------")
            let i = 0
            for (let data of socketConnection.cookieData.cookieLeaderboard) {
                i++

                linesOfText.push("#" + i + " " + data[0] + ": " + numberWithCommas(data[1]))

                if (linesOfText.length * 10 > Renderer.screen.getHeight() - 50) break
            }

            for (let i = 0; i < linesOfText.length; i++) {
                renderLibs.drawString(linesOfText[i], 10, 20 + 10 * i, 1)
            }
        }
    }

    fixNEU() {
        if (Client.currentGui && Client.currentGui.get() instanceof (this.GuiProfileViewer) && this.fixNeuNetworth.getValue()) {
            let guiProfileViewer = Client.currentGui.get()
            if (!guiProfileViewer.profile || !guiProfileViewer.profile.getHypixelProfile()) return
            let uuid = guiProfileViewer.profile.getHypixelProfile().get("uuid").getAsString().replace(/-/g, "")

            if (this.currentPlayerOpen != uuid) {
                this.currentPlayerOpen = uuid
                this.currentPlayerNetworth = {}

                fetch("http://soopy.dev/api/v2/player_skyblock/" + uuid).json(data => {
                    if (!data.success) return

                    if (this.currentPlayerOpen === data.data.uuid) {
                        Object.keys(data.data.profiles).forEach(profileId => {
                            if (!data.data.profiles[profileId].members[uuid].soopyNetworth.networth) return
                            this.currentPlayerNetworth[data.data.profiles[profileId].stats.cute_name] = JavaLong.valueOf(data.data.profiles[profileId].members[uuid].soopyNetworth.networth)
                        })
                    }
                })
            }

            let map = this.getField(guiProfileViewer.profile, "networth")
            Object.keys(this.currentPlayerNetworth).forEach(key => {
                map.put(new JavaString(key), new JavaLong(this.currentPlayerNetworth[key]))
            })
        }
    }

    getField(e, field) {
        let field2 = e.class.getDeclaredField(field);

        field2.setAccessible(true)

        return field2.get(e)
    }

    soopyWeight(user) {

        ChatLib.chat(this.FeatureManager.messagePrefix + "Finding senither weight for " + user)

        fetch("http://soopy.dev/api/v2/player/" + user).json(userData => {
            if (!userData.success) {
                ChatLib.chat(this.FeatureManager.messagePrefix + "&cError loading data: " + userData.error.description)
                return
            }

            fetch("http://soopy.dev/api/v2/player_skyblock/" + userData.data.uuid).json(sbData => {

                if (!sbData.success) {
                    ChatLib.chat(this.FeatureManager.messagePrefix + "&cError loading data: " + sbData.error.description)
                    return
                }

                ChatLib.chat("&c" + ChatLib.getChatBreak("-"))
                ChatLib.chat(userData.data.stats.nameWithPrefix + "'s senither weight (best profile):")
                ChatLib.chat("&aTotal: &b" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.bestProfileId].members[userData.data.uuid].weight.total)))
                new Message(new TextComponent("&aSkills: &b" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.bestProfileId].members[userData.data.uuid].weight.skill.total)))
                    .setHover("show_text", Object.keys(sbData.data.profiles[sbData.data.stats.bestProfileId].members[userData.data.uuid].weight.skill).map(skill => {
                        if (skill === "total") {
                            return null
                        }
                        return "&a" + firstLetterCapital(skill) + ": &b" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.bestProfileId].members[userData.data.uuid].weight.skill[skill].total)) + " &7(" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.bestProfileId].members[userData.data.uuid].weight.skill[skill].weight)) + " | " + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.bestProfileId].members[userData.data.uuid].weight.skill[skill].overflow)) + ")"
                    }).filter(a => a).join("\n"))).chat()
                new Message(new TextComponent("&aSlayer: &b" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.bestProfileId].members[userData.data.uuid].weight.slayer.total)))
                    .setHover("show_text", Object.keys(sbData.data.profiles[sbData.data.stats.bestProfileId].members[userData.data.uuid].weight.slayer).map(slayer => {
                        if (slayer === "total") {
                            return null
                        }
                        return "&a" + firstLetterCapital(slayer) + ": &b" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.bestProfileId].members[userData.data.uuid].weight.slayer[slayer].total)) + " &7(" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.bestProfileId].members[userData.data.uuid].weight.slayer[slayer].weight)) + " | " + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.bestProfileId].members[userData.data.uuid].weight.slayer[slayer].overflow)) + ")"
                    }).filter(a => a).join("\n"))).chat()
                new Message(new TextComponent("&aDungeon: &b" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.bestProfileId].members[userData.data.uuid].weight.dungeons.total)))
                    .setHover("show_text", Object.keys(sbData.data.profiles[sbData.data.stats.bestProfileId].members[userData.data.uuid].weight.dungeons).map(dungeons => {
                        if (dungeons === "total") {
                            return null
                        }
                        return "&a" + firstLetterCapital(dungeons) + ": &b" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.bestProfileId].members[userData.data.uuid].weight.dungeons[dungeons].total)) + " &7(" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.bestProfileId].members[userData.data.uuid].weight.dungeons[dungeons].weight)) + " | " + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.bestProfileId].members[userData.data.uuid].weight.dungeons[dungeons].overflow)) + ")"
                    }).filter(a => a).join("\n"))).chat()
                if (sbData.data.stats.bestProfileId !== sbData.data.stats.currentProfileId) {
                    ChatLib.chat(userData.data.stats.nameWithPrefix + "'s senither weight (current profile):")
                    ChatLib.chat("&aTotal: &b" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.currentProfileId].members[userData.data.uuid].weight.total)))
                    new Message(new TextComponent("&aSkills: &b" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.currentProfileId].members[userData.data.uuid].weight.skill.total)))
                        .setHover("show_text", Object.keys(sbData.data.profiles[sbData.data.stats.currentProfileId].members[userData.data.uuid].weight.skill).map(skill => {
                            if (skill === "total") {
                                return null
                            }
                            return "&a" + firstLetterCapital(skill) + ": &b" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.currentProfileId].members[userData.data.uuid].weight.skill[skill].total)) + " &7(" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.currentProfileId].members[userData.data.uuid].weight.skill[skill].weight)) + " | " + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.currentProfileId].members[userData.data.uuid].weight.skill[skill].overflow)) + ")"
                        }).filter(a => a).join("\n"))).chat()
                    new Message(new TextComponent("&aSlayer: &b" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.currentProfileId].members[userData.data.uuid].weight.slayer.total)))
                        .setHover("show_text", Object.keys(sbData.data.profiles[sbData.data.stats.currentProfileId].members[userData.data.uuid].weight.slayer).map(slayer => {
                            if (slayer === "total") {
                                return null
                            }
                            return "&a" + firstLetterCapital(slayer) + ": &b" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.currentProfileId].members[userData.data.uuid].weight.slayer[slayer].total)) + " &7(" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.currentProfileId].members[userData.data.uuid].weight.slayer[slayer].weight)) + " | " + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.currentProfileId].members[userData.data.uuid].weight.slayer[slayer].overflow)) + ")"
                        }).filter(a => a).join("\n"))).chat()
                    new Message(new TextComponent("&aDungeon: &b" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.currentProfileId].members[userData.data.uuid].weight.dungeons.total)))
                        .setHover("show_text", Object.keys(sbData.data.profiles[sbData.data.stats.currentProfileId].members[userData.data.uuid].weight.dungeons).map(dungeons => {
                            if (dungeons === "total") {
                                return null
                            }
                            return "&a" + firstLetterCapital(dungeons) + ": &b" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.currentProfileId].members[userData.data.uuid].weight.dungeons[dungeons].total)) + " &7(" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.currentProfileId].members[userData.data.uuid].weight.dungeons[dungeons].weight)) + " | " + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.currentProfileId].members[userData.data.uuid].weight.dungeons[dungeons].overflow)) + ")"
                        }).filter(a => a).join("\n"))).chat()
                }
                ChatLib.chat("&c" + ChatLib.getChatBreak("-"))

            })
        })
    }

    showFirstLoadPage() {
        if (!this.ranFirstLoadThing && World.isLoaded() && !this.firstLoadPageData.shown) {
            ChatLib.chat(this.FeatureManager.messagePrefix + "Opening first load page, if you accidentally close it run /soopyv2 and click the button")
            ChatLib.command("soopyv2 first_load_thing", true)
            this.ranFirstLoadThing = true
            this.firstLoadPageData.shown = true
            this.firstLoadPageData.version = 1
            FileLib.write("soopyAddonsData", "soopyv2firstloaddata.json", JSON.stringify(this.firstLoadPageData))
        }
    }
    verifyKey(key) {
        // console.log(key)
        if (key) {
            try {
                var url = "https://api.hypixel.net/key?key=" + key
                let data = fetch(url).json()

                // console.log(data)

                if (data.success) {
                    return true
                } else {
                    return false
                }
            } catch (e) {
                return false
            }
        } else {
            return false
        }
    }
    findKey() {
        new Notification("Finding key...", [])
        new Thread(() => {

            //       NEU
            try {
                let testKey = JSON.parse(new JavaString(Files.readAllBytes(Paths.get("./config/notenoughupdates/configNew.json")))).apiKey.apiKey
                if (testKey) {
                    if (this.verifyKey(testKey)) {
                        this.apiKeySetting.setValue(testKey)
                        new Notification("§aSuccess!", ["Found api key in NotEnoughUpdates!"])
                        return;
                    } else {
                        logger.logMessage("Found invalid key in NotEnoughUpdates", 3)
                    }
                }
            } catch (_) { }

            //       SBE
            try {
                let testKey = JSON.parse(new JavaString(Files.readAllBytes(Paths.get("./config/SkyblockExtras.cfg")))).values.apiKey
                if (testKey) {
                    if (this.verifyKey(testKey)) {
                        this.apiKeySetting.setValue(testKey)
                        new Notification("§aSuccess!", ["Found api key in SkyblockExtras!"])
                        return;
                    } else {
                        logger.logMessage("Found invalid key in SkyblockExtras", 3)
                    }
                }
            } catch (_) { }
            //       SKYTILS
            try {
                let testKey2 = new JavaString(Files.readAllBytes(Paths.get("./config/skytils/config.toml")))
                let testKey = undefined
                testKey2.split("\n").forEach(line => {
                    if (line.startsWith("		hypixel_api_key = \"")) {
                        testKey = line.split("\"")[1]
                    }
                })
                if (testKey) {
                    if (this.verifyKey(testKey)) {
                        this.apiKeySetting.setValue(testKey)
                        new Notification("§aSuccess!", ["Found api key in Skytils!"])
                        return;
                    } else {
                        logger.logMessage("Found invalid key in Skytils", 3)
                    }
                }
            } catch (_) { }

            //       SOOPYADDONS DATA
            try {
                let testKey = FileLib.read("soopyAddonsData", "apikey.txt")
                if (testKey) {
                    if (this.verifyKey(testKey)) {
                        this.apiKeySetting.setValue(testKey)
                        new Notification("§aSuccess!", ["Found api key in old soopyaddons version!"])
                        return;
                    } else {
                        logger.logMessage("Found invalid key in soopyaddonsData", 3)
                    }
                }
            } catch (_) { }

            //       HypixelApiKeyManager
            try {
                let testKey = JSON.parse(FileLib.read("HypixelApiKeyManager", "localdata.json")).key
                if (testKey) {
                    if (this.verifyKey(testKey)) {
                        this.apiKeySetting.setValue(testKey)
                        new Notification("§aSuccess!", ["Found api key in HypixelApiKeyManager!"])
                        return;
                    } else {
                        logger.logMessage("Found invalid key in HypixelApiKeyManager", 3)
                    }
                }
            } catch (_) { }


            new Notification("§cUnable to find api key", [])
        }).start()
    }

    apiNewCommand() {
        ChatLib.command("api new")
    }

    verifyKey2(key) {
        if (key) {
            try {
                var url = "https://api.hypixel.net/key?key=" + key
                let data = fetch(url).json()

                if (data.success) {
                    return true
                } else {
                    return false
                }
            } catch (e) {
                return false
            }
        }
        if (this.module.apiKeySetting.getValue() == "") {
            new Notification("§cError!", ["You need to set an api key first!"])
            return
        }


        new Thread(() => {
            try {
                var url = "https://api.hypixel.net/key?key=" + this.module.apiKeySetting.getValue()
                let data = fetch(url).json()

                if (data.success) {
                    new Notification("§aSuccess!", ["Your api key is valid!"])
                    return
                } else {
                    new Notification("§cError!", ["Your api key is invalid!"])
                    return
                }
            } catch (e) {
                new Notification("§cError!", ["Your api key is invalid!"])
                return
            }
        }).start()
    }

    newKey(key, event) {
        ChatLib.chat(this.FeatureManager.messagePrefix + "Copied api key!")
        this.apiKeySetting.setValue(key)
    }

    initVariables() {
        this.hudElements = [];
    }

    onDisable() {
        this.hudElements.forEach(h => h.delete())
        this.initVariables()
    }
}

class FirstLoadingPage extends GuiPage {
    constructor(mainThing) {
        super(-10)

        this.showBackButton = false

        this.name = "First load thing"

        this.mainThing = mainThing

        this.pageThings = []

        firstLoadPages.forEach((page, i) => {
            let newPage = this.newPage()

            newPage.addChild(page)

            page.setLoc(i !== 0, i !== firstLoadPages.length - 1)
            page.guiPage = this

            this.pageThings.push(newPage)
        })

        this.pageNum = 0

        this.finaliseLoading()
    }

    nextPage() {
        this.pageNum++

        this.goToPage(this.pageNum)
    }

    prevPage() {
        this.pageNum--

        this.goToPage(this.pageNum)
    }

    onOpen() {
        this.pageNum = 0

        firstLoadPages.forEach((page, i) => {
            page.load()
        })
    }
}

module.exports = {
    class: new GlobalSettings()
}
