import fs from "fs";
import { join } from "path";
import YAML from "yaml";

const contract_owners: { [address: string]: string } = {
  "0xc22834581ebc8527d974f8a1c97e1bea4ef910bc": "safe-global",
  "0xa6b71e26c5e0845f74c812102ca7114b6a896ab2": "safe-global",
  "0x4e59b44847b379578588920ca78fbf26c0b4956c": "arachnid", // TODO: add to OSS directory
  "0x0000000000ffe8b47b3e2130213b802212439497": "metamorphic", // TODO: https://github.com/0age/metamorphic
  "0x00000000f9490004c11cef243f5400493c00ad63": "open-sea", // TODO: https://github.com/ProjectOpenSea/seaport/
};

function walkAndRemove() {
  const walkDir = (dir: string): void => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const res = join(dir, entry.name);
      if (entry.isDirectory()) {
        walkDir(res);
      } else if (entry.isFile() && res.endsWith(".yaml")) {
        try {
          const fileContents = fs.readFileSync(res, "utf8");
          const project = YAML.parse(fileContents);
          const name = project.slug;
          if (project.optimism) {
            let modified = false;
            project.optimism = project.optimism.filter((contract: any) => {
              const contract_found = contract_owners[contract.address] ?? null;
              if (contract_found !== null && contract_found !== name) {
                console.log(`Removing ${contract.address} from ${name}`);
                modified = true;
                return false;
              }
              return true;
            });

            if (modified) {
              fs.writeFileSync(res, YAML.stringify(project), "utf8");
            }
          }
        } catch (err) {
          console.error(err);
        }
      }
    }
  };

  walkDir("data/projects");
}

walkAndRemove();
