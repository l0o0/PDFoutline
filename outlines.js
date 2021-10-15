function addOutlineItem(level, title, page, outlines) {
    if (outlines[level] === undefined) {
        outlines[level] = [];
    }
    let item = {
        level: level,
        title: title,
        page: page,
        subitem: [],
        parent: null,  // Parent item index in parent level
        first: null,  // Minimum page number of descendants
        last: null,  // Maximum page number of descendants
    };
    // This is a subitem, register in its parent
    if (level != 1) {
        item.parent = outlines[level - 1].length - 1;
        outlines[level - 1][outlines[level - 1].length - 1].subitem.push(outlines[level].length);
    }
    outlines[level].push(item);
    return outlines;
}

function addFirstLast(outlines) {
    var depth = Object.keys(outlines)[Object.keys(outlines).length - 1];
    for (var level = depth; level > 0; level--) {
        for (let item of outlines[level]) {
            if (item.parent === null) continue;
            if (outlines[level - 1][item.parent].first > item.page || outlines[level - 1][item.parent].first === null) {
                outlines[level - 1][item.parent].first = item.page;
            }
            if (outlines[level - 1][item.parent].last < item.page) {
                outlines[level - 1][item.parent].last = item.page;
            }
        }
    }
    return outlines;
}

var outlines = {};
for (let row of rows) {
    var cols = row.querySelectorAll("td");
    var level = cols.length - 1;
    var title = row.textContent.trim();
    var onclickText = cols[cols.length - 1]
        .querySelector("a")
        .getAttribute("onclick");
    var pageRex = onclickText.match(/CDMDNodeClick\('(\d+)'/);
    var page = pageRex[1];
    outlines = addOutlineItem(level, title, page, outlines);
}