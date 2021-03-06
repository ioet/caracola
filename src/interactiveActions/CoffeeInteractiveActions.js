import Database from '../database/Database';
import moment from 'moment';
import Store from '../store/Store';

class CoffeeInteractiveActions {

  static executeAction(payload) {
    console.log(`The user ${payload.user.name} in team ${payload.team.domain} pressed the welcome button`);
    const {user, channel} = payload;
    const action = payload.actions[0];
    let replacement = payload.original_message;
    let usersThatWantCoffee = Store.coffeeUsers;
    let pretext = 'Current users that want coffee are:';
    let actionToResolve;

    if(action.value === 'i_want_coffee' && (usersThatWantCoffee.indexOf(user.id) === -1)) {
      Store.addUser(user.id);
      actionToResolve = Promise.resolve(usersThatWantCoffee);
    }

    if(action.value === 'i_dont_want_coffee') {
      Store.removeUser(user.id);
      if(!usersThatWantCoffee.length) {
        pretext = 'What do you want?';
      }
      actionToResolve = Promise.resolve(usersThatWantCoffee);
    }

    if(action.value === 'ready_for_coffee') {
      actionToResolve = this.readyForCoffee(usersThatWantCoffee, channel.id, replacement)
        .then(newPretext => {
          Store.setUsers([]);
          pretext = newPretext;
          return Promise.resolve();
        });
    }

    return actionToResolve
      .then(() => {
        const text = usersThatWantCoffee.map(user => `<@${user}>`).join('\n');
        console.log(`The button had name ${action.name} and value ${action.value}`);
        replacement.attachments[0].text = text;
        replacement.attachments[0].pretext = pretext;
        return replacement;
      });
  }

  static readyForCoffee(usersThatWantCoffee, channelId, replacement) {
    return Database.getFromCollection(`coffeeLovers_${channelId}`)
      .then(users => {
        const userIds = users.map(user => user.userId);
        const validUsers = usersThatWantCoffee.filter(usr => userIds.indexOf(usr) === -1);
        const selectedPos = Math.floor((Math.random() * validUsers.length - 1) + 1);
        const selected = validUsers[selectedPos];

        if(selected) {
          return Database.saveToCollection(`coffeeLovers_${channelId}`,
            {userId: selected, timestamp: moment().valueOf()})
            .then(() => {
              if(replacement.attachments[0].actions) {
                delete replacement.attachments[0].actions;
              }

              return `<@${selected}> was selected to make ${usersThatWantCoffee.length} `+
                'cups of coffee :coffee: for: \n';
            });
        }

        return Database.dumpCollection(`coffeeLovers_${channelId}`)
          .then(() => this.readyForCoffee(usersThatWantCoffee, channelId, replacement));
      });
  }
}

export default CoffeeInteractiveActions;
