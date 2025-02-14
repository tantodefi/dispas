import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployERC5564: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const announcer = await deploy("ERC5564Announcer", {
    from: deployer,
    args: [],
    log: true,
  });

  await deploy("ERC5564Registry", {
    from: deployer,
    args: [],
    log: true,
  });

  return !announcer.newlyDeployed;
};

export default deployERC5564;
deployERC5564.tags = ["ERC5564"];
deployERC5564.id = "deploy_erc5564"; 