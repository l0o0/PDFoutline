var zotfileLoader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Components.interfaces.mozIJSSubScriptLoader);
zotfileLoader.loadSubScript('chrome://zotfile/content/pdf-lib.min.js')

const getPageRefs = (pdfDoc) => {
    const refs = [];
    pdfDoc.catalog.Pages().traverse((kid, ref) => {
        console.log(ref)
        if (kid instanceof PDFLib.PDFPageLeaf) refs.push(ref);
    });
    return refs;
};

const createOutlineItem = (pdfDoc, title, parent, prev, next, first, last, count, page) => {
    let array = PDFLib.PDFArray.withContext(pdfDoc.context);
    array.push(page);
    array.push(PDFLib.PDFName.of("XYZ"));
    array.push(PDFLib.PDFNull);
    array.push(PDFLib.PDFNull);
    array.push(PDFLib.PDFNull);
    const map = new Map();
    map.set(PDFLib.PDFName.Title, PDFLib.PDFString.of(title));
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
}

var array = await OS.File.read("D:/workspace/PDFoutline/a.pdf");
var int8Array = new Uint8Array(array);
var doc = await PDFLib.PDFDocument.load(int8Array);

const pageRefs = getPageRefs(doc);
const outlinesDictRef = doc.context.nextRef();
const outlineItem1Ref = doc.context.nextRef();
const outlineItem2Ref = doc.context.nextRef();
const outlineItem3Ref = doc.context.nextRef();
const outlineItem4Ref = doc.context.nextRef();
const outlineItem5Ref = doc.context.nextRef();
const outlineItem6Ref = doc.context.nextRef();
const outlineItem7Ref = doc.context.nextRef();

const outlineItem1 = createOutlineItem(
    doc,
    "Document",
    outlinesDictRef,
    null,
    outlineItem6Ref,
    outlineItem2Ref,
    outlineItem5Ref,
    4,
    pageRefs[0]
);

const outlineItem2 = createOutlineItem(
    doc,
    "Section 1",
    outlineItem1Ref,
    null,
    outlineItem3Ref,
    null,
    null,
    null,
    pageRefs[1]
);

const outlineItem3 = createOutlineItem(
    doc,
    "Section 2",
    outlineItem1Ref,
    outlineItem2Ref,
    outlineItem5Ref,
    outlineItem4Ref,
    outlineItem4Ref,
    1,
    pageRefs[2]
);

const outlineItem4 = createOutlineItem(
    doc,
    "Subsection 1",
    outlineItem3Ref,
    null,
    null,
    null,
    null,
    null,
    pageRefs[3]
);

const outlineItem5 = createOutlineItem(
    doc,
    "Section 3",
    outlineItem1Ref,
    outlineItem3Ref,
    null,
    null,
    null,
    null,
    pageRefs[4]
);

const outlineItem6 = createOutlineItem(
    doc,
    "Summary",
    outlinesDictRef,
    outlineItem1Ref,
    null,
    null,
    null,
    null,
    pageRefs[7]
);

const outlinesDictMap = new Map();
outlinesDictMap.set(PDFLib.PDFName.Type, PDFLib.PDFName.of("Outlines"));
outlinesDictMap.set(PDFLib.PDFName.of("First"), outlineItem1Ref);
outlinesDictMap.set(PDFLib.PDFName.of("Last"), outlineItem6Ref);
outlinesDictMap.set(PDFLib.PDFName.of("Count"), PDFLib.PDFNumber.of(6)); //This is a count of the number of outline items. Should be changed for X no. of outlines

//Pointing the "Outlines" property of the PDF's "Catalog" to the first object of your outlines
doc.catalog.set(PDFLib.PDFName.of("Outlines"), outlinesDictRef)

const outlinesDict = PDFLib.PDFDict.fromMapWithContext(outlinesDictMap, doc.context);

//First 'Outline' object. Refer to table H.3 in Annex H.6 of PDF Specification doc.
doc.context.assign(outlinesDictRef, outlinesDict);

//Actual outline items that will be displayed
doc.context.assign(outlineItem1Ref, outlineItem1);
doc.context.assign(outlineItem2Ref, outlineItem2);
doc.context.assign(outlineItem3Ref, outlineItem3);
doc.context.assign(outlineItem4Ref, outlineItem4);
doc.context.assign(outlineItem5Ref, outlineItem5);
doc.context.assign(outlineItem6Ref, outlineItem6);

const file = await doc.save();
await OS.File.writeAtomic("D:/workspace/PDFoutline/c.pdf", file, {
    tmpPath: "D:/workspace/PDFoutline/c.pdf" + ".tmp",
});