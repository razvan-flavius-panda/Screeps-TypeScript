import { ErrorMapper } from "utils/ErrorMapper";
import pluralize from 'pluralize';

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  console.log(`💖 Current game tick is ${Game.time} 💖`);

  var log = (toExecute: any, message: String) => {
    console.log("⏬ " + message);
    toExecute();
    console.log("⏫ " + message);
  };

  var roleHarvester = {
    run: function (creep: any) {
      if (creep.store.getFreeCapacity() > 0) {
        var sources = creep.room.find(FIND_SOURCES);
        if (creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
          creep.moveTo(sources[0], { visualizePathStyle: { stroke: '#ffaa00' } });
        }
      }
      else {
        var targets = creep.room.find(FIND_STRUCTURES, {
          filter: (structure: any) => {
            return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) &&
              structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
          }
        });
        if (targets.length > 0) {
          if (creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#ffffff' } });
          }
        }
      }
    }
  };

  var roleUpgrader = {
    run: function (creep: any) {
      if (creep.store[RESOURCE_ENERGY] == 0) {
        var sources = creep.room.find(FIND_SOURCES);
        if (creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
          creep.moveTo(sources[0]);
        }
      }
      else {
        if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
          creep.moveTo(creep.room.controller);
        }
      }
    }
  };

  var roleBuilder = {
    run: function (creep: any) {
      if (creep.memory.building && creep.store[RESOURCE_ENERGY] == 0) {
        creep.memory.building = false;
      }
      if (!creep.memory.building && creep.store.getFreeCapacity() == 0) {
        creep.memory.building = true;
      }

      if (creep.memory.building) {
        var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
        if (targets.length) {
          if (creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
            creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#ffffff' } });
          }
        }
      }
      else {
        var sources = creep.room.find(FIND_SOURCES);
        if (creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
          creep.moveTo(sources[0], { visualizePathStyle: { stroke: '#ffaa00' } });
        }
      }
    }
  };

  for (var name in Game.rooms) {
    console.log('Room "' + name + '" has ' + Game.rooms[name].energyAvailable + ' energy');
  }

  for (var name in Memory.creeps) {
    if (!Game.creeps[name]) {
      delete Memory.creeps[name];
      console.log('Clearing non-existing creep memory:', name);
    }
  }

  // BEGIN


  // TODO Meld merge vvv

  var harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester');

  if (harvesters.length < 2) {
    var newName = 'Harvester' + Game.time;
    console.log('Spawning new harvester: ' + newName);
    Game.spawns['Spawn1'].spawnCreep([WORK, CARRY, MOVE],
      newName, { memory: { role: 'harvester' } });
  }



  var upgraders = _.filter(Game.creeps, (creep) => creep.memory.role == 'upgrader');

  if (upgraders.length < 2) {
    var newName = 'Upgrader' + Game.time;
    console.log('Spawning new upgrader: ' + newName);
    Game.spawns['Spawn1'].spawnCreep([WORK, CARRY, MOVE],
      newName, { memory: { role: 'upgrader' } });
  }



  var builders = _.filter(Game.creeps, (creep) => creep.memory.role == 'builder');

  if (builders.length < 2) {
    var newName = 'Builder' + Game.time;
    console.log('Spawning new builder: ' + newName);
    Game.spawns['Spawn1'].spawnCreep([WORK, CARRY, MOVE],
      newName, { memory: { role: 'builder' } });
  }

  // TODO Meld merge ^^^

  if (Game.spawns['Spawn1'].spawning) {
    var spawningCreep = Game.creeps[Game.spawns['Spawn1'].spawning.name];
    Game.spawns['Spawn1'].room.visual.text(
      '🛠️' + spawningCreep.memory.role,
      Game.spawns['Spawn1'].pos.x + 1,
      Game.spawns['Spawn1'].pos.y,
      { align: 'left', opacity: 0.8 });
  }



  for (var name in Game.creeps) {
    var creep = Game.creeps[name];
    // TODO
    if (creep.memory.role == 'harvester') {
      creep.say('🔄');
      log(() => roleHarvester.run(creep), "harvester role logic");
    }
    if (creep.memory.role == 'upgrader') {
      creep.say('🔝');
      log(() => roleUpgrader.run(creep), "upgrader role logic");
    }
    if (creep.memory.role == 'builder') {
      creep.say('🚧');
      log(() => roleBuilder.run(creep), "builder role logic");
    }
  }

  // END

  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }
});
