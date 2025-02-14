import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployDispas: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const announcer = await hre.deployments.get("ERC5564Announcer");

  const dispas = await deploy("DispasStealth", {
    from: deployer,
    args: [announcer.address],
    log: true,
  });

  return !dispas.newlyDeployed;
};

export default deployDispas;
deployDispas.tags = ["Dispas"];
deployDispas.dependencies = ["ERC5564"];
deployDispas.id = "deploy_dispas"; 