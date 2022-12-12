#### When creating a plugin source in `sources.json`, follow the instructions below so you can provide the proper information.

Glass is capable of handling all of spigot resources automatically, [Github](#github) releases, and [Bukkit](#bukkit) projects.
_Keep in mind, all scopes are case sensitive_

## Github

When providing github information, the format for the source is as follows:

```json
{
	"name": "string",
	"scope": "string",
	"source": "string",
	"content-type": ["string"],
	"file_index": "int"
}
```

Here is what each field does:
|key|value|
|---|---|
|name|The name of the plugin, unique and is used for caching the plugin data, and the url|
|scope|Where this plugin is pulled from, in this case `Github` should be the value|
|source|The plugin repository, formatted as `{organization}/{repository}`, example: `GlassDashboard/backend`|
|content-type|What kind of file type we are looking for, for jars, you can usually opt for [the defaults](#default-content-types)|
|file_index|Which file should we take from the releases, plugins like `EssentialsX` also contain other plugins in their releases|

## Bukkit

For any plugins that are not provided in SpigotMC but rather Bukkit's page, you can opt to use this option. The default JSON for this object is:

```json
{
	"name": "string",
	"scope": "string",
	"source": "int",
	"logo": "uri (string)"
}
```

Here is what each field does:
|key|value|
|---|---|
|name|The name of the plugin, unique and is used for caching the plugin data|
|scope|Where this plugin is pulled from, in this case `Bukkit` should be the value|
|source|This should be the bukkit project id provided by the CurseForge API, [learn more](#obtaining-a-project-id)|
|logo|A logo for the plugin, this should be a 1:1 aspect ratio image|

### Default Content Types

For github sources, you can usually opt for the default `JAR` releases, which are the following:

```json
"content-type": ["application/octet-stream", "application/java-archive", "application/jar"]
```

### Obtaining a Project ID

Obtaining a project idea is a fairly simple task, it does however requires you to send a API request to CurseForge, luckily this can be done with an unauthorized GET request.

1. Using the following request, attach the project name at the end of the URI: `https://api.curseforge.com/servermods/projects?search=`. In the case of `WorldEdit`, our URI will be: `https://api.curseforge.com/servermods/projects?search=worldedit`
2. Look for the correct project based on it's name, in this case `WorldEdit` is the 4th index labeled "WorldEdit for Bukkit"
3. At this point, we can take the ID off of that specific project and use it in our source.
