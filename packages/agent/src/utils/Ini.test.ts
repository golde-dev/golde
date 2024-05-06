import { assertEquals } from "@std/assert";
import { INI } from "./Ini.ts";

Deno.test("INI - fromObject and toObject", () => {
  const data = {
    section1: {
      key1: "value1",
      key2: true,
    },
    section2: {
      key3: "value3",
      key4: false,
    },
  };

  const result = INI.fromObject(data).toObject();
  assertEquals(result, data);
});

Deno.test("INI - fromString", () => {
  const data = `
    [Unit]
    Description=deployer
    After=network.target

    [Install]
    WantedBy=multi-user.target

    [Service]
    ExecPreStart=/opt/deployer/agent prestart1
    ExecPreStart=/opt/deployer/agent prestart2
    ExecStart=/opt/deployer/agent start
    EnvironmentFile=/opt/deployer/.env
    Restart=always
    PrivateTmp=yes
    User=root
  `;

  const expected = {
    Unit: {
      Description: "deployer",
      After: "network.target",
    },
    Install: {
      WantedBy: "multi-user.target",
    },
    Service: {
      ExecPreStart: [
        "/opt/deployer/agent prestart1",
        "/opt/deployer/agent prestart2",
      ],
      ExecStart: "/opt/deployer/agent start",
      EnvironmentFile: "/opt/deployer/.env",
      Restart: "always",
      PrivateTmp: true,
      User: "root",
    },
  };

  const object = INI.fromString(data).toObject();
  assertEquals(object, expected);
});

Deno.test("INI - fromString and toString", () => {
  const data = `
[section1]
key1=value1
key2=yes

[section2]
key3=value3
key4=no
`;

  const result = INI.fromString(data).toString();
  console.log(result);
  assertEquals(result.trim(), data.trim());
});
