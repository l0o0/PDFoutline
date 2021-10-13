var sample = await Zotero.File.getContentsAsync("D:/workspace/PDFoutline/a.pdf", null, 200);
return sample;

var doc = await Zotero.Jasminum.PDFLib.PDFDocument.load(
);

var array = await OS.File.read("D:/workspace/PDFoutline/a.pdf");
var int8Array = Uint8Array.from(array);

OS.File.read("D:/workspace/PDFoutline/a.pdf").then(
    function onSuccess(array) {
        // create Uint8Array from file data
        var int8View = new Uint8Array(array);
        var doc = await Zotero.Jasminum.PDFLib.PDFDocument.load(
            int8View
        );
        Zotero.debug(doc);
    }
);