import * as jsonData from '../module.json' assert { type: 'json' };
const moduleId = jsonData.id;

Hooks.once('init', () => {
  console.log(`${moduleId} | Hook: init`);
});

function renderCCPointsButton(app, jqHtml, data) {
  console.log(`${moduleId}:cc-points-button.js | Hook: renderCharacterSheet`);
  // Get a reference to the Skills list container
  const skillsNoteboxSpan = jqHtml.find('span.skills.note-box');
  const skillsNoteDiv = skillsNoteboxSpan.find('div.note-main');

  // Add a button that will calculate the attribute/skill points used in character creation
  const button = document.createElement('button');
  button.id = 'cc-button';
  button.style.marginLeft = '10px';
  button.innerText = 'Calculate CC Points';
  skillsNoteDiv.append(button);

  // Add a p tag that will display the attribute/skill points used in character creation when the button is clicked
  const p = document.createElement('p');
  p.id = 'cc-results';
  p.style.marginLeft = '10px';
  p.innerText = 'Attributes: ? | Skills: ?';
  skillsNoteDiv.append(p);

  // Click event for the button
  button.addEventListener('click', () => {
    const attributePoints = calculateAttributePoints(data.actor);
    const skillPoints = calculateSkillPoints(data.actor);
    p.innerText = `Attributes: ${attributePoints} | Skills: ${skillPoints}`;
  });
}
Hooks.on('renderCharacterSheet', renderCCPointsButton);

function getAttributes(actor) {
  const attributes = actor.system.attributes;
  return {
    agility: attributes.agility.die.sides,
    smarts: attributes.smarts.die.sides,
    spirit: attributes.spirit.die.sides,
    strength: attributes.strength.die.sides,
    vigor: attributes.vigor.die.sides,
  };
}

function getRawAttributes(actor) {
  const rawAttributes = actor.system._source.attributes;
  return {
    agility: rawAttributes.agility.die.sides,
    smarts: rawAttributes.smarts.die.sides,
    spirit: rawAttributes.spirit.die.sides,
    strength: rawAttributes.strength.die.sides,
    vigor: rawAttributes.vigor.die.sides,
  };
}

function getSkills(actor) {
  const items = actor.items;
  const skills = items.filter(
    (item) => item.type === 'skill' && item.system.swid !== 'unskilled-attempt' && item.system.swid !== 'none',
  );
  return skills.map((skill) => {
    return {
      name: skill.name,
      die: skill.system.die.sides,
      attribute: skill.system.attribute,
      core: skill.system.isCoreSkill,
    };
  });
}

function getRawSkills(actor) {
  const rawItems = actor._source.items;
  const rawSkills = rawItems.filter(
    (item) => item.type === 'skill' && item.system.swid !== 'unskilled-attempt' && item.system.swid !== 'none',
  );
  return rawSkills.map((skill) => {
    return {
      name: skill.name,
      die: skill.system.die.sides,
      attribute: skill.system.attribute,
      core: skill.system.isCoreSkill,
    };
  });
}

function calculateAttributePoints(actor) {
  const attributes = getRawAttributes(actor);
  return Object.values(attributes).reduce((total, die) => total + Math.max(die - 4, 0) / 2, 0);
}

function calculateSkillPoints(actor) {
  // Final real values of skills
  const skills = getSkills(actor);
  // Source value of skills (ignoring active effects)
  const rawSkills = getRawSkills(actor);
  // Final real values of attributes (to use as caps for skills)
  const attributes = getAttributes(actor);
  // The total cost of all skills
  let totalSkillPoints = 0;

  // Process each skill
  for (const skill of rawSkills) {
    // Get the matching real skill
    const realSkill = skills.find((s) => s.name === skill.name);
    // Get the difference between the skill's real value and the raw value
    const effectsModifer = realSkill ? realSkill.die - skill.die : 0;
    // Determine whether this is a granted skill (granted skills start at d4)
    const granted = isGrantedSkill(actor, skill.name);
    // Determine the minimum die size for this skill (granted and core skills start at d4, others at d2 (actually 0 but d2 for algorithm purposes) )
    const minimum = (granted || skill.core ? 4 : 2) + effectsModifer;
    // Determine the soft maximum die size for this skill (they can go over, for double cost)
    const softMax = attributes[skill.attribute];
    // Get the actual die size, which is either the real skill's die or, if there is no real skill, the raw skill's die
    const finalDieSize = realSkill ? realSkill.die : skill.die;
    // console.log(skill.name, 'start', minimum, 'attribute', softMax, 'final', finalDieSize);
    // Accumulate the cost of the skill
    let skillCost = 0;
    let skillCounter = minimum;
    while (skillCounter < finalDieSize) {
      // Increasing a die which is less than the soft maximum costs 1 point
      if (skillCounter < softMax) {
        skillCost += 1;
      }
      // Increasing a die which is equal to or greater than the soft maximum costs 2 points
      else {
        skillCost += 2;
      }
      // Die sizes increase in steps of 2 (d4, d6, d8, d10, d12, etc.)
      skillCounter += 2;
    }
    // console.log(skill.name, `d${skill.die}`, skill.attribute, `d${softMax}`, 'Cost', skillCost);
    totalSkillPoints += skillCost;
  }

  return totalSkillPoints;
}

function isGrantedSkill(actor, skillName) {
  const items = actor.items;
  for (const item of items) {
    const grants = item.system.grants;
    if (grants) {
      for (const grant of grants) {
        if (grant.name === skillName) {
          // console.log(`${skillName} is granted by ${item.name}`);
          return true;
        }
      }
    }
  }
  return false;
}
