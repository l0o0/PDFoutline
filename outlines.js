var outlines = {
    depth: 0,
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0
};

function addOutlineItem(level, title, page, outlines) {
    outlines[level] += 1;
    let id = `${level}_${outlines[level]}`;
    let item = {
        level: level,
        title: title,
        page: page,
        idx: outlines[level],
        prev: outlines[level] === 1 ? null : `${level}_${outlines[level] - 1}`,
        next: null,  // Need to fill after traverse all outlines
        subitem: 0,  // Count of descendants
        parent: level != 1 ? `${level - 1}_${outlines[level - 1]}` : null,  // Parent item index in parent level
        first: null,  // Minimum page number of descendants
        last: null,  // Maximum page number of descendants
    };

    outlines.depth = outlines.depth < level ? level : outlines.depth;
    outlines[id] = item;
    return outlines;
}

function addFirstLast(outlines) {
    for (var level = outlines.depth; level > 0; level--) {
        for (var idx = 1; idx <= outlines[level]; idx++) {
            console.log(level, idx)
            var item = outlines[`${level}_${idx}`];
            if (idx != outlines[level] && item.parent === outlines[`${level}_${idx + 1}`].parent) item.next = `${level}_${idx + 1}`;

            // Prev and Next should in the same parent item.
            if (item.prev && item.parent != outlines[item.prev].parent) item.prev = null;

            if (!item.parent) continue;

            var parentItem = outlines[item.parent];
            if (!parentItem.first
                || (
                    outlines[parentItem.first].page > item.page
                    && (outlines[parentItem.first].level + outlines[parentItem.first].idx) > (level + idx)
                )) {
                parentItem.first = `${level}_${idx}`;
            }
            if (!parentItem.last
                || (
                    outlines[parentItem.last].page < item.page
                    && (outlines[parentItem.last].level + outlines[parentItem.last].idx) < (level + idx)
                )) {
                parentItem.last = `${level}_${idx}`;
            }

            let subitemCount = item.subitem === 0 ? 1 : item.subitem;
            parentItem.subitem += subitemCount;
        }
    }
    return outlines;
}

function createOutlineItem(pdfDoc, title, parent, prev, next, first, last, count, page) {
    Zotero.debug("createOutlineItem");
    let array = PDFLib.PDFArray.withContext(pdfDoc.context);
    array.push(page);
    array.push(PDFLib.PDFName.of("XYZ"));
    array.push(PDFLib.PDFNull);
    array.push(PDFLib.PDFNull);
    array.push(PDFLib.PDFNull);
    const map = new Map();
    map.set(PDFLib.PDFName.Title, PDFLib.PDFHexString.fromText(title));
    map.set(PDFLib.PDFName.Parent, parent);
    if (first != null) {
        map.set(PDFLib.PDFName.of("First"), first);
    }
    if (last != null) {
        map.set(PDFLib.PDFName.of("Last"), last);
    }
    if (prev != null) {
        map.set(PDFLib.PDFName.of("Prev"), prev);
    }
    if (next != null) {
        map.set(PDFLib.PDFName.of("Next"), next);
    }
    if (count != null) {
        map.set(PDFLib.PDFName.of("Count"), PDFLib.PDFNumber.of(count));
    }
    map.set(PDFLib.PDFName.of("Dest"), array);

    return PDFLib.PDFDict.fromMapWithContext(map, pdfDoc.context);
};

async function addOutline(filename, outlines) {
    let array = await OS.File.read(filename);
    let int8Array = new Uint8Array(array);
    var doc = await PDFLib.PDFDocument.load(int8Array);

    var pageRefs = [];
    doc.catalog.Pages().traverse((kid, ref) => {
        if (kid instanceof PDFLib.PDFPageLeaf) pageRefs.push(ref);
    });

    // Create Dict ref at 0
    var itemRefById = { 'root': doc.context.nextRef() };
    for (let id in outlines) {
        if (!id.includes("_")) continue;
        itemRefById[id] = doc.context.nextRef();
    }

    var outlinesDictMap = new Map();
    outlinesDictMap.set(PDFLib.PDFName.Type, PDFLib.PDFName.of("Outlines"));
    outlinesDictMap.set(PDFLib.PDFName.of("First"), itemRefById['1_1']);
    outlinesDictMap.set(PDFLib.PDFName.of("Last"), itemRefById[`1_${outlines[1]}`]);
    //This is a count of the number of outline items. Should be changed for X no. of outlines
    outlinesDictMap.set(PDFLib.PDFName.of("Count"), PDFLib.PDFNumber.of(outlines.total));
    var outlinesDict = PDFLib.PDFDict.fromMapWithContext(outlinesDictMap, doc.context);
    //Pointing the "Outlines" property of the PDF's "Catalog" to the first object of your outlines
    doc.catalog.set(PDFLib.PDFName.of("Outlines"), itemRefById.root);
    //First 'Outline' object. Refer to table H.3 in Annex H.6 of PDF Specification doc.
    doc.context.assign(itemRefById.root, outlinesDict);

    for (let id in outlines) {
        if (!id.includes("_")) continue;
        let item = outlines[id];
        Zotero.debug(id);

        var outlineItem = createOutlineItem(
            doc,
            item.title,
            item.parent ? itemRefById[item.parent] : itemRefById.root,
            item.prev ? itemRefById[item.prev] : null,
            item.next ? itemRefById[item.next] : null,
            item.first ? itemRefById[item.first] : null,
            item.last ? itemRefById[item.last] : null,
            item.subitem > 0 ? item.subitem : null,
            pageRefs[item.page - 1]
        );
        doc.context.assign(itemRefById[id], outlineItem);
    }
    Zotero.debug("All item compelte");
    let file = await doc.save();
    Zotero.debug("1");
    await OS.File.writeAtomic("/home/l0o0/workspace/PDFoutline/c.pdf", file, {
        tmpPath: "/home/l0o0/workspace/PDFoutline/c.pdf" + ".tmp",
    });
};

let chapterUrl = "https://kreader.cnki.net/Kreader/buildTree.aspx?dbCode=cdmd&FileName=1021698775.nh&TableName=CMFDTEMP&sourceCode=GDLLU&date=&year=2021&period=&fileNameList=&compose=&subscribe=&titleName=&columnCode=&previousType=_&uid=";
var chapter = await Zotero.HTTP.request("GET", chapterUrl);
var chapterHTML = Zotero.Jasminum.Utils.string2HTML(
    chapter.responseText
);
var tree = chapterHTML.getElementById("treeDiv");
var rows = tree.querySelectorAll("tr");
outlines['total'] = rows.length;
for (let row of rows) {
    var cols = row.querySelectorAll("td");
    var level = cols.length - 1;
    var title = row.textContent.trim();
    var onclickText = cols[cols.length - 1]
        .querySelector("a")
        .getAttribute("onclick");
    var pageRex = onclickText.match(/CDMDNodeClick\('(\d+)'/);
    var page = parseInt(pageRex[1]);
    outlines = addOutlineItem(level, title, page, outlines);
}
outlines = addFirstLast(outlines);

await addOutline("/home/l0o0/t1.pdf", outlines);