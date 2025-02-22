/// <reference types="../CTAutocomplete" />
/// <reference lib="es2015" />

if (net.minecraftforge.fml.common.Loader.isModLoaded("soopyv2forge")) {
    new Thread(() => {
        while (!Java.type("me.soopyboo32.soopyv2forge.SoopyV2Forge").INSTANCE) {
            Thread.sleep(1000)
        }

        Java.type("me.soopyboo32.soopyv2forge.SoopyV2Forge").INSTANCE.soopyIsInstalled()
    }).start()
}

const File = Java.type("java.io.File")
class SoopyAddons {
    constructor() {
        this.FeatureManager = require("./featureClass/featureManager.js")

        this.FeatureManager.parent = this
    }
}
if (FileLib.read("soopyAddonsData", "deletesoopyv1please.txt") === "true") {
    new Thread(() => {
        Thread.sleep(2000)
        FileLib.deleteDirectory(new File("./config/ChatTriggers/modules/soopyAddons"))

        FileLib.write("soopyAddonsData", "deletesoopyv1please.txt", "false")

        ChatLib.command("ct reload", true)
    }).start()
} else {
    let a = register("worldLoad", () => {
        if (FileLib.read("soopyAddonsData", "firstload.txt") !== "true") {
            b = register("tick", () => {
                new Thread(() => {
                    ChatLib.chat("&7Loading SoopyV2 required modules...") //idk what to say to chat, but it requires an extra ct load after starting to load stuff like mappings (maby this should be part of mappings module, but i put it here so it doesent try to load the first load page thingo)
                    FileLib.write("soopyAddonsData", "firstload.txt", "true")
                    Thread.sleep(2000)

                    ChatLib.command("ct reload", true)
                }).start()

                b.unregister()
            })
        } else {
            new SoopyAddons()
        }
        a.unregister()
    })
}

if (new File("./config/ChatTriggers/modules/SoopyV2UpdateButtonPatcher").exists()) {
    new Thread(() => {
        Thread.sleep(2000)
        ChatLib.chat("&7Deleting SoopyV2UpdateButtonPatcher as its no longer needed")
        FileLib.deleteDirectory(new File("./config/ChatTriggers/modules/SoopyV2UpdateButtonPatcher"))
    }).start()
}