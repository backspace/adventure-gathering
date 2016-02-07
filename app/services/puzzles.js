import Ember from 'ember';

// Is a service the best place for these utility functions?

export default Ember.Service.extend({
  chooseBlankIndex({answer, mask, goalDigit}) {
    if (!this.maskIsValid({answer, mask})) {
      throw Error('Mask is invalid');
    }

    return mask.split('').reduce(({maxDistance, maxDistanceIndex}, maskCharacter, index) => {
      if (maskCharacter !== '_') {
        return {maxDistance, maxDistanceIndex};
      } else {
        const answerDigit = parseInt(answer[index]);
        const thisDistance = Math.abs(answerDigit - goalDigit);

        if (thisDistance > maxDistance) {
          return {maxDistance: thisDistance, maxDistanceIndex: index};
        } else {
          return {maxDistance, maxDistanceIndex};
        }
      }
    }, {maxDistance: -1}).maxDistanceIndex;
  },

  teamDigitsForAnswerAndGoalDigits({teams, answerDigit, goalDigit}) {
    if (teams.length > 2) {
      throw Error('More than two teams are not supported');
    } else if (teams.length < 1) {
      throw Error('You must supply at least one team');
    }

    const difference = goalDigit - answerDigit;

    if (teams.length === 1) {
      return new Map([[teams[0], difference]]);
    } else {
      const sortedTeams = teams.sortBy('name');

      return new Map([
        [sortedTeams[0], Math.ceil(difference/2)],
        [sortedTeams[1], Math.floor(difference/2)]
      ]);
    }
  },

  maskIsValid({answer, mask}) {
    if (answer.length !== mask.length) {
      return false;
    }

    for (let i = 0; i < answer.length; i++) {
      const answerCharacter = answer[i];
      const maskCharacter = mask[i];

      if (answerCharacter !== maskCharacter) {
        if (answerCharacter.match(/\d/)) {
          if (maskCharacter !== '_') {
            return false;
          }
        } else {
          return false;
        }
      }
    }

    return mask.indexOf('_') > -1;
  }
});