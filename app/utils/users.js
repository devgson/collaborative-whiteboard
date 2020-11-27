var moment = require('moment');

class User {
  constructor () {
    this.users =[];
  }

  addUser (id, name, room, isAdmin) {
    var user = { 
      id,
      name,
      room,
      joinedAt: moment.now(),
      isAdmin,
      canEdit: isAdmin
    };
    this.users.push(user);
    return user;
  }

  selectNewAdmin() {
    const sortedUsers = this.users.sort((a, b) => moment(a.joinedAt).valueOf() - moment(b.joinedAt).valueOf());
    this.setAsAdmin(sortedUsers[0]);
  }

  setAsAdmin(user) {
    this.users = this.users.map(value => {
      if(value.id === user.id){
        value.isAdmin = true;
        value.canEdit = true;
      }
      return value;
    })
  }

  allowEdit(id){
    var user = this.getUser(id);
    this.users = this.users.map(value => {
      if(value.id === user.id){
        value.canEdit = true;
      }
      return value;
    })
  }

  removeUser (id) {
    var user = this.getUser(id);
    if( user ){
      this.users = this.users.filter( user => user.id !== id )
    }
    return user;
  }

  getUser (id) {
    return this.users.filter( user => user.id === id )[0];
  }

  getUsername (name, room) {
    var users =  this.getUserList(room);
    return users.filter(user => user.name === name ).length > 0;
  }

  getUserList (room) {
    return this.users.filter( user => user.room === room );
  }
}

module.exports = { User };