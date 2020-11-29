const Whiteboard = require("./whiteboardModel");

class Drawings {
    constructor () {
      this.drawings = [];
    }
  
    addStartDrawing(data, id) {
      this.drawings.push({ [id] : { start: data, middle:[], end: {} } });
    }

    addMiddleDrawing(data, id) {
      this.drawings.forEach(drawing => {
        for (const key in drawing) {
          if (key == id) {
            drawing[id].middle.push(data);
          }
        }
      })
    }

    addEndDrawing(data, id) {
      this.drawings.forEach(drawing => {
        for (const key in drawing) {
          if (key == id) {
            drawing[id].end = data.point
          }
        }
      })
    }

    async saveWhiteboard(){
      try {
        return await new Whiteboard({ drawings: this.drawings }).save();
      } catch (error) {
        return error;
      }
    }

    async getSavedWhiteboards(){
      try {
        return await Whiteboard.find();
      } catch (error) {
        return error;
      }
    }

    async getWhiteboard(id){
      try {
        return await Whiteboard.findById(id);
      } catch (error) {
        return error;
      }
    }
  
  }
  
  module.exports = { Drawings };