from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from textwrap import wrap
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib


PROJECT_DIR = Path(__file__).resolve().parent
PDF_PATH = PROJECT_DIR / "TrendCart_Project_Summary.pdf"
PPTX_PATH = PROJECT_DIR / "TrendCart_Project_Presentation.pptx"


PROJECT_TITLE = "TrendCart Project Summary"
PROJECT_SUBTITLE = "Full-stack shopping, food ordering, and movie booking platform"
GITHUB_URL = "https://github.com/ss6988893-alt/trendcart"
LIVE_URL = "https://trendcart-production.up.railway.app"


PAGES = [
    {
        "title": "Project Overview",
        "subtitle": "Platform summary",
        "bullets": [
            "TrendCart is a single web platform that combines product shopping, food ordering, and movie ticket booking in one project.",
            "The application is built as a full-stack solution with a browser frontend, Node.js and Express backend, MySQL database, session-based authentication, and Razorpay integration.",
            f"Live application: {LIVE_URL}",
            f"GitHub repository: {GITHUB_URL}",
        ],
    },
    {
        "title": "Main User Modules",
        "subtitle": "Core customer-facing flows",
        "bullets": [
            "Products module: 8 categories with real-style product names, local category images, product detail pages, cart flow, and checkout.",
            "Food module: 5 hotel-based menus with search, nearby sorting via geolocation, category sections, add-to-cart, and responsive ordering flow.",
            "Movies module: movie selection, theatre and show-time chips, seat locking, snack add-ons, booking summary, and printable ticket view.",
        ],
    },
    {
        "title": "Key Features Implemented",
        "subtitle": "Working functionality",
        "bullets": [
            "Authentication uses name, email, and password with backend session handling.",
            "Razorpay is the only payment method across checkout flows.",
            "Admin dashboard includes CRUD tools, analytics cards, live order management, and movie ticket status handling.",
            "Movie booking includes seat locking to prevent conflicts while users complete checkout.",
            "Responsive improvements were added for smaller devices, especially 320px to 480px mobile screens.",
        ],
    },
    {
        "title": "Tech Stack and Architecture",
        "subtitle": "Implementation details",
        "bullets": [
            "Frontend: HTML, CSS, and vanilla JavaScript with page-specific layouts and animations.",
            "Backend: Node.js, Express, dotenv, express-session, bcryptjs, and mysql2.",
            "Database: MySQL with automatic table setup and seed refresh logic for product and food catalogs.",
            "Assets: local product, food, and movie image folders are used to make the catalog feel more realistic.",
            "Deployment: code is stored on GitHub and deployed to Railway for the live app.",
        ],
    },
    {
        "title": "Current Project Outcome",
        "subtitle": "What the project demonstrates",
        "bullets": [
            "A polished end-to-end web project with browsing, cart, payment, order history, profile, admin control, and movie ticket flow.",
            "A live deployment connected to GitHub with Railway hosting and Razorpay support.",
            "A project structure suitable for demos, presentations, portfolio use, and further upgrades such as stronger analytics or notification features.",
            "Local run flow: clone the repo, install dependencies, set the .env values, start the server, and open the app in the browser.",
        ],
    },
]


def esc_pdf(text: str) -> str:
    return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def build_pdf() -> None:
    page_width = 595
    page_height = 842
    margin_left = 54
    title_y = 770
    subtitle_y = 742
    line_height = 22

    objects: list[bytes] = []

    def add_obj(data: str | bytes) -> int:
        payload = data.encode("latin-1") if isinstance(data, str) else data
        objects.append(payload)
        return len(objects)

    font_obj = add_obj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    bold_obj = add_obj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>")

    page_refs = []

    for page in PAGES:
        stream_lines = [
            "BT",
            "/F2 24 Tf",
            f"1 0 0 1 {margin_left} {title_y} Tm",
            f"({esc_pdf(page['title'])}) Tj",
            "ET",
            "BT",
            "/F1 13 Tf",
            f"1 0 0 1 {margin_left} {subtitle_y} Tm",
            f"({esc_pdf(page['subtitle'])}) Tj",
            "ET",
        ]

        y = 700
        for bullet in page["bullets"]:
            wrapped = wrap(bullet, width=72)
            for index, line in enumerate(wrapped):
                prefix = "- " if index == 0 else "  "
                stream_lines.extend(
                    [
                        "BT",
                        "/F1 13 Tf",
                        f"1 0 0 1 {margin_left} {y} Tm",
                        f"({esc_pdf(prefix + line)}) Tj",
                        "ET",
                    ]
                )
                y -= line_height
            y -= 10

        footer = f"Generated on {datetime.now().strftime('%d %b %Y')}  |  TrendCart"
        stream_lines.extend(
            [
                "BT",
                "/F1 10 Tf",
                f"1 0 0 1 {margin_left} 36 Tm",
                f"({esc_pdf(footer)}) Tj",
                "ET",
            ]
        )

        stream = "\n".join(stream_lines).encode("latin-1")
        content_obj = add_obj(
            b"<< /Length " + str(len(stream)).encode("ascii") + b" >>\nstream\n" + stream + b"\nendstream"
        )
        page_obj = add_obj(
            f"<< /Type /Page /Parent PAGES_REF /MediaBox [0 0 {page_width} {page_height}] "
            f"/Resources << /Font << /F1 {font_obj} 0 R /F2 {bold_obj} 0 R >> >> "
            f"/Contents {content_obj} 0 R >>"
        )
        page_refs.append(page_obj)

    kids = " ".join(f"{ref} 0 R" for ref in page_refs)
    pages_obj = add_obj(f"<< /Type /Pages /Count {len(page_refs)} /Kids [{kids}] >>")

    for idx, payload in enumerate(objects):
        if b"PAGES_REF" in payload:
            objects[idx] = payload.replace(b"PAGES_REF", f"{pages_obj} 0 R".encode("ascii"))

    catalog_obj = add_obj(f"<< /Type /Catalog /Pages {pages_obj} 0 R >>")

    pdf = bytearray()
    pdf.extend(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets = [0]

    for number, payload in enumerate(objects, start=1):
        offsets.append(len(pdf))
        pdf.extend(f"{number} 0 obj\n".encode("ascii"))
        pdf.extend(payload)
        pdf.extend(b"\nendobj\n")

    xref_offset = len(pdf)
    pdf.extend(f"xref\n0 {len(objects) + 1}\n".encode("ascii"))
    pdf.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        pdf.extend(f"{offset:010d} 00000 n \n".encode("ascii"))

    pdf.extend(
        (
            f"trailer\n<< /Size {len(objects) + 1} /Root {catalog_obj} 0 R >>\n"
            f"startxref\n{xref_offset}\n%%EOF"
        ).encode("ascii")
    )

    PDF_PATH.write_bytes(pdf)


def xml_escape(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&apos;")
    )


def paragraph_runs(text: str) -> str:
    return (
        "<a:p>"
        "<a:r><a:rPr lang=\"en-US\" sz=\"1800\" dirty=\"0\" smtClean=\"0\"/>"
        f"<a:t>{xml_escape(text)}</a:t></a:r>"
        "<a:endParaRPr lang=\"en-US\" sz=\"1800\" dirty=\"0\"/>"
        "</a:p>"
    )


def slide_xml(title: str, subtitle: str, bullets: list[str]) -> str:
    bullet_xml = []
    bullet_xml.append(
        "<a:p>"
        "<a:r><a:rPr lang=\"en-US\" sz=\"1800\" dirty=\"0\" smtClean=\"0\"/>"
        f"<a:t>{xml_escape(subtitle)}</a:t></a:r>"
        "<a:endParaRPr lang=\"en-US\" sz=\"1800\" dirty=\"0\"/>"
        "</a:p>"
    )
    for bullet in bullets:
        for idx, line in enumerate(wrap(bullet, width=58)):
            level = "0" if idx == 0 else "1"
            text = line if idx == 0 else line
            bullet_xml.append(
                f"<a:p lvl=\"{level}\">"
                "<a:pPr marL=\"342900\" indent=\"-171450\"/>"
                "<a:r><a:rPr lang=\"en-US\" sz=\"1800\" dirty=\"0\" smtClean=\"0\"/>"
                f"<a:t>{xml_escape(text)}</a:t></a:r>"
                "<a:endParaRPr lang=\"en-US\" sz=\"1800\" dirty=\"0\"/>"
                "</a:p>"
            )

    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
 xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="0" cy="0"/>
          <a:chOff x="0" y="0"/>
          <a:chExt cx="0" cy="0"/>
        </a:xfrm>
      </p:grpSpPr>
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="2" name="Title 1"/>
          <p:cNvSpPr/>
          <p:nvPr/>
        </p:nvSpPr>
        <p:spPr/>
        <p:txBody>
          <a:bodyPr/>
          <a:lstStyle/>
          <a:p>
            <a:r>
              <a:rPr lang="en-US" sz="2600" b="1"/>
              <a:t>{xml_escape(title)}</a:t>
            </a:r>
            <a:endParaRPr lang="en-US" sz="2600"/>
          </a:p>
        </p:txBody>
      </p:sp>
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="3" name="Content Placeholder 2"/>
          <p:cNvSpPr txBox="1"/>
          <p:nvPr/>
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm>
            <a:off x="685800" y="1549400"/>
            <a:ext cx="7772400" cy="4114800"/>
          </a:xfrm>
        </p:spPr>
        <p:txBody>
          <a:bodyPr wrap="square"/>
          <a:lstStyle/>
          {''.join(bullet_xml)}
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr>
    <a:masterClrMapping/>
  </p:clrMapOvr>
</p:sld>
"""


def build_pptx() -> None:
    core_created = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    slide_count = len(PAGES)

    content_types = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  {''.join(f'<Override PartName="/ppt/slides/slide{i}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>' for i in range(1, slide_count + 1))}
</Types>
"""

    root_rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>
"""

    app_xml = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"
 xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Microsoft Office PowerPoint</Application>
  <PresentationFormat>On-screen Show (16:9)</PresentationFormat>
  <Slides>{slide_count}</Slides>
  <Notes>0</Notes>
  <HiddenSlides>0</HiddenSlides>
  <MMClips>0</MMClips>
  <ScaleCrop>false</ScaleCrop>
  <HeadingPairs>
    <vt:vector size="2" baseType="variant">
      <vt:variant><vt:lpstr>Slides</vt:lpstr></vt:variant>
      <vt:variant><vt:i4>{slide_count}</vt:i4></vt:variant>
    </vt:vector>
  </HeadingPairs>
  <TitlesOfParts>
    <vt:vector size="{slide_count}" baseType="lpstr">
      {''.join(f'<vt:lpstr>{xml_escape(page["title"])}</vt:lpstr>' for page in PAGES)}
    </vt:vector>
  </TitlesOfParts>
  <Company>TrendCart</Company>
  <LinksUpToDate>false</LinksUpToDate>
  <SharedDoc>false</SharedDoc>
  <HyperlinksChanged>false</HyperlinksChanged>
  <AppVersion>16.0000</AppVersion>
</Properties>
"""

    core_xml = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
 xmlns:dc="http://purl.org/dc/elements/1.1/"
 xmlns:dcterms="http://purl.org/dc/terms/"
 xmlns:dcmitype="http://purl.org/dc/dcmitype/"
 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>{xml_escape(PROJECT_TITLE)}</dc:title>
  <dc:subject>{xml_escape(PROJECT_SUBTITLE)}</dc:subject>
  <dc:creator>Codex</dc:creator>
  <cp:keywords>TrendCart, summary, presentation</cp:keywords>
  <dc:description>{xml_escape(PROJECT_SUBTITLE)}</dc:description>
  <cp:lastModifiedBy>Codex</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">{core_created}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">{core_created}</dcterms:modified>
</cp:coreProperties>
"""

    presentation_xml = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
 xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" saveSubsetFonts="1" autoCompressPictures="0">
  <p:sldMasterIdLst>
    <p:sldMasterId id="2147483648" r:id="rId1"/>
  </p:sldMasterIdLst>
  <p:sldIdLst>
    {''.join(f'<p:sldId id="{256 + i}" r:id="rId{i + 2}"/>' for i in range(slide_count))}
  </p:sldIdLst>
  <p:sldSz cx="12192000" cy="6858000"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>
"""

    presentation_rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
""" + "".join(
        f'  <Relationship Id="rId{i + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide{i + 1}.xml"/>\n'
        for i in range(slide_count)
    ) + "</Relationships>\n"

    slide_master_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
 xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:bg>
      <p:bgPr>
        <a:solidFill><a:srgbClr val="F7FBFF"/></a:solidFill>
        <a:effectLst/>
      </p:bgPr>
    </p:bg>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="0" cy="0"/>
          <a:chOff x="0" y="0"/>
          <a:chExt cx="0" cy="0"/>
        </a:xfrm>
      </p:grpSpPr>
    </p:spTree>
  </p:cSld>
  <p:clrMap accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6"
   bg1="lt1" bg2="lt2" folHlink="folHlink" hlink="hlink" tx1="dk1" tx2="dk2"/>
  <p:sldLayoutIdLst>
    <p:sldLayoutId id="1" r:id="rId1"/>
  </p:sldLayoutIdLst>
  <p:txStyles>
    <p:titleStyle/>
    <p:bodyStyle/>
    <p:otherStyle/>
  </p:txStyles>
</p:sldMaster>
"""

    slide_master_rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>
"""

    slide_layout_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
 xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="titleAndContent" preserve="1">
  <p:cSld name="Title and Content">
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="0" cy="0"/>
          <a:chOff x="0" y="0"/>
          <a:chExt cx="0" cy="0"/>
        </a:xfrm>
      </p:grpSpPr>
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldLayout>
"""

    slide_layout_rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>
"""

    theme_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="TrendCart Theme">
  <a:themeElements>
    <a:clrScheme name="TrendCart">
      <a:dk1><a:srgbClr val="16253B"/></a:dk1>
      <a:lt1><a:srgbClr val="FFFFFF"/></a:lt1>
      <a:dk2><a:srgbClr val="1F3E76"/></a:dk2>
      <a:lt2><a:srgbClr val="EFF4FB"/></a:lt2>
      <a:accent1><a:srgbClr val="0F8BFF"/></a:accent1>
      <a:accent2><a:srgbClr val="6BC6FF"/></a:accent2>
      <a:accent3><a:srgbClr val="6D78FF"/></a:accent3>
      <a:accent4><a:srgbClr val="FF7A36"/></a:accent4>
      <a:accent5><a:srgbClr val="3FCF8E"/></a:accent5>
      <a:accent6><a:srgbClr val="D94F70"/></a:accent6>
      <a:hlink><a:srgbClr val="0F8BFF"/></a:hlink>
      <a:folHlink><a:srgbClr val="1F3E76"/></a:folHlink>
    </a:clrScheme>
    <a:fontScheme name="TrendCart Fonts">
      <a:majorFont>
        <a:latin typeface="Arial"/>
        <a:ea typeface="Arial"/>
        <a:cs typeface="Arial"/>
      </a:majorFont>
      <a:minorFont>
        <a:latin typeface="Arial"/>
        <a:ea typeface="Arial"/>
        <a:cs typeface="Arial"/>
      </a:minorFont>
    </a:fontScheme>
    <a:fmtScheme name="TrendCart Format">
      <a:fillStyleLst>
        <a:solidFill><a:schemeClr val="lt1"/></a:solidFill>
      </a:fillStyleLst>
      <a:lnStyleLst>
        <a:ln w="9525" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="accent1"/></a:solidFill></a:ln>
      </a:lnStyleLst>
      <a:effectStyleLst>
        <a:effectStyle><a:effectLst/></a:effectStyle>
      </a:effectStyleLst>
      <a:bgFillStyleLst>
        <a:solidFill><a:schemeClr val="lt2"/></a:solidFill>
      </a:bgFillStyleLst>
    </a:fmtScheme>
  </a:themeElements>
  <a:objectDefaults/>
  <a:extraClrSchemeLst/>
</a:theme>
"""

    slide_rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>
"""

    with ZipFile(PPTX_PATH, "w", ZIP_DEFLATED) as zf:
        zf.writestr("[Content_Types].xml", content_types)
        zf.writestr("_rels/.rels", root_rels)
        zf.writestr("docProps/app.xml", app_xml)
        zf.writestr("docProps/core.xml", core_xml)
        zf.writestr("ppt/presentation.xml", presentation_xml)
        zf.writestr("ppt/_rels/presentation.xml.rels", presentation_rels)
        zf.writestr("ppt/slideMasters/slideMaster1.xml", slide_master_xml)
        zf.writestr("ppt/slideMasters/_rels/slideMaster1.xml.rels", slide_master_rels)
        zf.writestr("ppt/slideLayouts/slideLayout1.xml", slide_layout_xml)
        zf.writestr("ppt/slideLayouts/_rels/slideLayout1.xml.rels", slide_layout_rels)
        zf.writestr("ppt/theme/theme1.xml", theme_xml)

        for idx, page in enumerate(PAGES, start=1):
            zf.writestr(f"ppt/slides/slide{idx}.xml", slide_xml(page["title"], page["subtitle"], page["bullets"]))
            zf.writestr(f"ppt/slides/_rels/slide{idx}.xml.rels", slide_rels)


def write_report_text() -> None:
    report_path = PROJECT_DIR / "TrendCart_Project_Summary.txt"
    lines = [PROJECT_TITLE, "=" * len(PROJECT_TITLE), ""]
    for page in PAGES:
        lines.append(page["title"])
        lines.append("-" * len(page["title"]))
        lines.append(page["subtitle"])
        lines.extend(f"- {bullet}" for bullet in page["bullets"])
        lines.append("")
    report_path.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    write_report_text()
    build_pdf()
    build_pptx()
    digest = hashlib.sha1(PDF_PATH.read_bytes()).hexdigest()[:8]
    print(f"Created: {PDF_PATH.name}")
    print(f"Created: {PPTX_PATH.name}")
    print(f"Checksum: {digest}")


if __name__ == "__main__":
    main()
