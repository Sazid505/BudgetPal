import sys, json, os, re

MODEL_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "expense_model.pkl")
VECT_FILE  = os.path.join(os.path.dirname(os.path.abspath(__file__)), "vectorizer.pkl")

KEYWORD_RULES = [
    ("Food", [
        "grocery","groceries","supermarket","walmart","costco","loblaws","sobeys",
        "metro","nofrills","no frills","food basics","iga","restaurant","cafe",
        "coffee","tim hortons","starbucks","mcdonalds","mcdonald","burger","pizza",
        "sushi","fast food","takeout","take out","doordash","uber eats","skip the dishes",
        "dinner","lunch","breakfast","brunch","meal","snack","bakery","sandwich","taco",
        "kfc","wendy","chipotle","thai","chinese food","indian food","italian food",
        "food","eating","dining","diner","bistro","pub","beer","wine","alcohol","liquor",
        "drinks","juice","milk","bread","meat","vegetables","fruit","produce","dairy",
        "shawarma","noodle","ramen","pho","bbq","grill","wings","fries","chips","candy",
        "chocolate","ice cream","dessert","donut","bagel","muffin","pancake","waffle",
    ]),
    ("Transportation", [
        "bus","transit","subway","metro","ttc","stm","translink","train","go train",
        "via rail","amtrak","railway","rail","uber","lyft","taxi","cab","rideshare",
        "gas","gasoline","petrol","fuel","shell","esso","petro","parking","toll",
        "highway","car wash","carwash","flight","airline","air canada","westjet",
        "porter","flair","airport","plane","travel","trip","greyhound","bike","cycling",
        "scooter","moped","car rental","enterprise","hertz","avis","auto","mechanic",
        "tire","oil change","car repair","garage","ferry","boat","commute","ticket",
        "pass","presto","transport","vehicle","motor","driving","shuttle",
    ]),
    ("Healthcare", [
        "pharmacy","pharmacie","shoppers","rexall","london drugs","walgreens","cvs",
        "drug store","drugstore","doctor","physician","clinic","hospital","emergency",
        "dentist","dental","orthodontist","optometrist","glasses","contacts","vision",
        "prescription","medicine","medication","vitamin","supplement","health","medical",
        "physio","physiotherapy","chiropractor","massage therapy","therapy",
        "counselling","counseling","lab","blood test","mri","ultrasound",
        "health insurance","drug plan","nurse","surgery","specialist",
        "vet","veterinary","animal hospital","pet meds",
    ]),
    ("Housing", [
        "rent","mortgage","landlord","lease","hydro","electricity","electric bill",
        "power bill","water bill","gas bill","natural gas","enbridge","internet",
        "wifi","cable","rogers","bell","telus","shaw","phone bill","cell bill",
        "mobile bill","home insurance","property tax","furniture","ikea","appliance",
        "mattress","sofa","renovation","repair","plumber","electrician","contractor",
        "cleaning","housekeeping","laundry","dry clean","home depot","lowes",
        "hardware store","tools","paint","condo fee","strata","hoa","maintenance",
        "alarm","security","pest control","moving","storage unit","utilities",
    ]),
    ("Entertainment", [
        "netflix","spotify","youtube","disney","hulu","prime video","streaming",
        "apple tv","crave","paramount","movie","cinema","theatre","theater","concert",
        "show","event","festival","game","gaming","xbox","playstation","steam",
        "nintendo","video game","board game","park","zoo","museum","gallery",
        "aquarium","bowling","mini golf","escape room","laser tag","karaoke","comedy",
        "sports event","hockey","basketball","baseball","amusement","theme park",
        "nightclub","club","lounge","entertainment","amazon prime","apple music",
        "tidal","deezer","twitch","subscription",
    ]),
    ("Shopping", [
        "amazon","ebay","etsy","aliexpress","wish","clothing","clothes","shirt",
        "pants","dress","shoes","jacket","coat","boots","sneakers","zara","gap",
        "old navy","banana republic","winners","marshalls","nordstrom","the bay",
        "sephora","ulta","beauty","electronics","best buy","staples","apple store",
        "shopping","mall","retail","accessory","watch","jewelry","jewellery",
        "bag","purse","gift","toy","canadian tire","sport chek","thrift","value village",
    ]),
    ("Personal", [
        "haircut","hair salon","barber","hairdresser","stylist","nail salon",
        "manicure","pedicure","gym","fitness","yoga","pilates","crossfit","workout",
        "spa","massage","facial","skincare","personal care","grooming","razor",
        "shampoo","soap","deodorant","toothpaste","hygiene","pet","dog food",
        "cat food","pet store","litter","laundry","dry cleaning","self care",
    ]),
    ("Education", [
        "tuition","university","college","school","course","textbook","book","books",
        "study","class","lecture","workshop","seminar","training","certification",
        "udemy","coursera","skillshare","masterclass","lynda","student","academic",
        "exam","test prep","library","supplies","notebook","stationery",
        "tutoring","tutor","e-learning","online course","degree",
    ]),
    ("Debt Payments", [
        "loan payment","credit card payment","line of credit","mortgage payment",
        "car loan","student loan","debt repayment","minimum payment",
        "installment","emi","interest charge","finance charge","consolidation",
    ]),
    ("Miscellaneous", [
        "donation","charity","atm","withdrawal","fee","service charge","bank fee",
        "nsf","overdraft","annual fee","post office","stamps","shipping","postage",
        "courier","legal","lawyer","notary","government","license","permit",
        "accountant","misc","miscellaneous","tax preparation",
    ]),
]


def keyword_predict(desc):
    text = re.sub(r"[^a-z0-9\s]", " ", desc.lower().strip())
    for category, keywords in KEYWORD_RULES:
        for kw in keywords:
            if re.search(r"\b" + re.escape(kw.lower()) + r"\b", text):
                return category
    return None


def ml_predict(desc):
    if not os.path.exists(MODEL_FILE) or not os.path.exists(VECT_FILE):
        return None
    try:
        import joblib
        model      = joblib.load(MODEL_FILE)
        vectorizer = joblib.load(VECT_FILE)
        x   = vectorizer.transform([desc])
        cat = str(model.predict(x)[0]).strip()
        return cat if cat and cat != "Other" else None
    except Exception:
        return None


def predict(desc):
    if not desc or not desc.strip():
        return "Other"
    result = keyword_predict(desc)
    if result:
        return result
    result = ml_predict(desc)
    if result:
        return result
    return "Other"


def out(data):
    sys.stdout.write(json.dumps(data) + "\n")
    sys.stdout.flush()


if __name__ == "__main__":
    if len(sys.argv) >= 2 and sys.argv[1] in ("--labels", "--categories", "--classes"):
        cats = [r[0] for r in KEYWORD_RULES]
        if os.path.exists(MODEL_FILE):
            try:
                import joblib
                model  = joblib.load(MODEL_FILE)
                labels = getattr(model, "classes_", None)
                if labels is not None:
                    for c in list(labels):
                        if isinstance(c, bytes):
                            c = c.decode("utf-8", "ignore")
                        c = str(c).strip()
                        if c and c not in cats:
                            cats.append(c)
            except Exception:
                pass
        out({"categories": cats})
        sys.exit(0)

    if len(sys.argv) < 2:
        out({"category": "Other", "error": "Missing description"})
        sys.exit(1)

    out({"category": predict(sys.argv[1])})
