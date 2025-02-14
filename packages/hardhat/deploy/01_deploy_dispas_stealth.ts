import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, get } = hre.deployments;

  // Get the deployed announcer address
  const announcer = await get("ERC5564Announcer");

  // Deploy DispasStealth with the announcer address
  await deploy("DispasStealth", {
    from: deployer,
    args: [announcer.address], // Pass announcer address to constructor
    log: true,
    autoMine: true,
  });
};

export default func;
func.tags = ["DispasStealth"];
func.dependencies = ["ERC5564"]; // Ensure ERC5564 contracts are deployed first 