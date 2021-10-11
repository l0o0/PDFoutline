const { PDFDocument, PDFPageLeaf, PDFDict, PDFString, PDFArray, PDFName, PDFNull, PDFNumber, } = require("pdf-lib");
const fs = require("fs");

async function creatOutlines() {
    const doc = await PDFDocument.load(
        fs.readFileSync("a.pdf")
    );

    const getPageRefs = (pdfDoc) => {
        const refs = [];
        pdfDoc.catalog.Pages().traverse((kid, ref) => {
            console.log(ref)
            if (kid instanceof PDFPageLeaf) refs.push(ref);
        });
        return refs;
    };
    //(PDFDocument, string, PDFRef, PDFRef, PDFRef, boolean)
    const createOutlineItem = (pdfDoc, title, parent, prev, next, first, last, count, page) => {
        let array = PDFArray.withContext(pdfDoc.context);
        array.push(page);
        array.push(PDFName.of("XYZ"));
        array.push(PDFNull);
        array.push(PDFNull);
        array.push(PDFNull);
        const map = new Map();
        map.set(PDFName.Title, PDFString.of(title));
        map.set(PDFName.Parent, parent);
        if (first != null) {
            map.set(PDFName.of("First"), first);
        }
        if (last != null) {
            map.set(PDFName.of("Last"), last);
        }
        if (prev != null) {
            map.set(PDFName.of("Prev"), prev);
        }
        if (next != null) {
            map.set(PDFName.of("Next"), next);
        }
        if (count != null) {
            map.set(PDFName.of("Count"), PDFNumber.of(count));
        }
        map.set(PDFName.of("Dest"), array);

        return PDFDict.fromMapWithContext(map, pdfDoc.context);
    }

    const pageRefs = getPageRefs(doc);
    console.log(pageRefs)

    // Root ref
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
    outlinesDictMap.set(PDFName.Type, PDFName.of("Outlines"));
    outlinesDictMap.set(PDFName.of("First"), outlineItem1Ref);
    outlinesDictMap.set(PDFName.of("Last"), outlineItem6Ref);
    outlinesDictMap.set(PDFName.of("Count"), PDFNumber.of(6)); //This is a count of the number of outline items. Should be changed for X no. of outlines

    //Pointing the "Outlines" property of the PDF's "Catalog" to the first object of your outlines
    doc.catalog.set(PDFName.of("Outlines"), outlinesDictRef)

    const outlinesDict = PDFDict.fromMapWithContext(outlinesDictMap, doc.context);

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

    fs.writeFileSync("b.pdf", file);
}

creatOutlines();
