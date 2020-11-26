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
  
  }
  
  //var user = new User();
  
  module.exports = { Drawings };