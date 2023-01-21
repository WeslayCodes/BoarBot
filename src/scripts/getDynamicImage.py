from PIL import Image, ImageSequence, ImageFont, ImageDraw, ImageChops
import base64
from io import BytesIO
import requests

textFontBig = ImageFont.truetype("C:\\Users\\wesle\\Downloads\\Minecraft Regular.otf", 35)
textFontMedium = ImageFont.truetype("C:\\Users\\wesle\\Downloads\\Minecraft Regular.otf", 25)

while(True):
    inputVals = input().split(",")

    backColor = Image.open(inputVals[0]).convert("RGBA").resize((465, 540))
    boarImage = Image.open(inputVals[1])
    frontImage = Image.open("assets\\DailyBackgroundBase.png").convert("RGBA").resize((465, 540))

    circleMask = Image.open("assets\\CircleMask.png").convert("RGBA").resize((75, 75))
    userAvatar = Image.open(BytesIO(requests.get(inputVals[2]).content)).convert("RGBA").resize((75, 75))
    userAvatar.putalpha(ImageChops.multiply(userAvatar.getchannel("A"), circleMask.getchannel("A")).convert("L"))

    userTag = inputVals[-1].split("|")[1]
    userID = inputVals[-1].split("|")[2]
    if len(userTag) > 23:
        userTag = userTag[:17] + userTag[userTag.index("#"):] 

    namePlate = Image.open("assets\\DailyBackgroundNameplate.png").convert("RGBA").resize((textFontMedium.getsize(userTag)[0] + 55, 40))
    boarName = inputVals[-1].split("|")[0]
    title = inputVals[-1].split("|")[3]

    frames = []

    for frame in ImageSequence.Iterator(boarImage):
        backColor = backColor.copy().convert("RGBA")
        frame = frame.copy().resize((443, 443)).convert("RGBA")
        backColor.paste(frame, (13,84))
        backColor = backColor.copy().convert("RGBA")
        backColor.paste(frontImage, mask=frontImage)
        backColor = backColor.copy().convert("RGBA")
        backColor.paste(namePlate, (51, 482), mask=namePlate)
        backColor = backColor.copy().convert("RGBA")
        backColor.paste(userAvatar, (18, 447), mask=userAvatar)
        backColorDraw = ImageDraw.Draw(backColor)
        backColorDraw.text((232, 15), title, (222, 222, 222), font=textFontBig, anchor="mt")
        backColorDraw.text((232, 50), boarName, (222, 222, 222), font=textFontMedium, anchor="mt")
        backColorDraw.text((98, 490), userTag, (222, 222, 222), font=textFontMedium)
        frames.append(backColor)

    output = BytesIO()
    frames[0].save(output, format="GIF", save_all=True, append_images=frames[1:], loop=0)
    img_data = output.getvalue()

    print(userID + ":" + str(base64.b64encode(img_data))[2:-1])