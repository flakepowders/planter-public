function calcTable(year, month, eventlist) {
    let arr = new Array(1);
    for (let x = 0; x < arr.length; x++) {
        arr[x] = new Array(6);

    }
    for (let x = 0; x < arr.length; x++) {
        for (let y = 0; y < arr[x].length; y++) {
            arr[x][y] = new Array(7);
        }
    }
    for (let m = 0; m < arr.length; m++) {
        let startDayInWeek = (new Date(year, month - 1, 0).getDay() + 1) % 7;
        let monthLong = new Date(year, month, 0).getDate() + 1;
        let beforCount = 0;
        let counter = 1;
        let startCount = false;
        for (let x = 0; x < arr[0].length; x++) {
            for (let y = 0; y < arr[0][x].length; y++) {
                if (beforCount == startDayInWeek) {
                    startCount = true;
                } else {
                    beforCount++;
                }
                if (startCount == true) {

                    arr[0][x][y] ={};
                    arr[0][x][y].date = counter;
                    arr[0][x][y].events = [];
                    for (let i = 0; i < eventlist.length; i++) {
                        if (eventlist[i].day == counter) {
                            arr[0][x][y].events.push(eventlist[i]);
                        }
                    }
                    counter++;

                } else {
                    arr[0][x][y] = {};
                }

                if (counter > monthLong) {
                    arr[0][x][y] = {};

                }
            }
        }
    }

    return arr;
}

module.exports = calcTable;