# Copyright 2021-2022 frto027
# MIT License

# anm2 to css

import xml.etree.ElementTree as ET

anms = ET.parse("908.000_baby plum.anm2")
anms = anms.find("Animations")

output_anims = {

}

BASE_SCALE = 2
ANIM_PREFIX = "baby_plum_anm_"
FPS = 30
for anm in anms:
    assert anm.tag == "Animation"
    anm_name = anm.attrib["Name"]
    frames = []
    for frame in anm.find("LayerAnimations/LayerAnimation"):
        frames.append({
            "XPos":float(frame.attrib["XPosition"]), # the last transform
            "YPos":float(frame.attrib["YPosition"]),
            "XCrop":float(frame.attrib["XCrop"]), # background position
            "YCrop":float(frame.attrib["YCrop"]),
            "XScale":float(frame.attrib["XScale"]),
            "YScale":float(frame.attrib["YScale"]),
            "XPiv":float(frame.attrib["XPivot"]),# pre translate(neg)
            "YPiv":float(frame.attrib["YPivot"]),

            "Rotation":float(frame.attrib["Rotation"]),
            "Duration":int(frame.attrib["Delay"]),
            "Interp":frame.attrib["Interpolated"] == "true"
        })
    frames_remake = []
    for i in range(len(frames)):
        if frames[i]["Duration"] == 1 or i == len(frames) - 1 or not ["Interp"]:
            frames_remake.append(frames[i])
        else:
            target = frames[i]
            next_target = frames[i+1]
            for i in range(target["Duration"]):
                cur_step = i / target["Duration"]
                frames_remake.append(
                    {
                        "XPos":(cur_step * (next_target["XPos"] - target["XPos"]) + target["XPos"]),
                        "YPos":(cur_step * (next_target["YPos"] - target["YPos"]) + target["YPos"]),
                        "XCrop":(0 * (next_target["XCrop"] - target["XCrop"]) + target["XCrop"]),
                        "YCrop":(0 * (next_target["YCrop"] - target["YCrop"]) + target["YCrop"]),
                        "XScale":(cur_step * (next_target["XScale"] - target["XScale"]) + target["XScale"]),
                        "YScale":(cur_step * (next_target["YScale"] - target["YScale"]) + target["YScale"]),
                        "XPiv":(cur_step * (next_target["XPiv"] - target["XPiv"]) + target["XPiv"]),
                        "YPiv":(cur_step * (next_target["YPiv"] - target["YPiv"]) + target["YPiv"]),

                        "Rotation":(cur_step * (next_target["Rotation"] - target["Rotation"]) + target["Rotation"]),
                        "Duration":1,
                        "Interp":False,
                    }
                )
    output_anims[anm_name] = frames_remake

for anm_name in output_anims:
    anm_len = 0
    for frame in output_anims[anm_name]:
        anm_len += frame["Duration"]

    print("""
.%s{
    animation:%s %fms step-end infinite both
}""" %(ANIM_PREFIX + anm_name,ANIM_PREFIX + anm_name, anm_len * 1000/FPS))

    cur_time = 0
    print("@keyframes %s {" %( ANIM_PREFIX + anm_name))
    for frame in output_anims[anm_name]:
        # print("  %f%%{ transform: translate(-32px, -32px)  scale(%s) translate(32px, 32px) translate(%spx, %spx) translate(-32px, -32px) rotate(%sdeg) scale(%s,%s) translate(32px, 32px) translate(%spx, %spx); background-position: %dpx  %dpx;}" %(
        # print("  %f%%{ transform: translate(-32px, -32px)  scale(%s) translate(%spx, %spx) rotate(%sdeg) scale(%s,%s) translate(32px, 32px) translate(%spx, %spx); background-position: %dpx  %dpx;}" %(
        #     cur_time*100/anm_len,
        #     BASE_SCALE,
        #     frame["XPos"], 
        #     frame["YPos"],
        #     frame["Rotation"],
        #     frame["XScale"]/100, frame["YScale"]/100,
        #     -frame["XPiv"],-frame["YPiv"], 
        #     -int(frame["XCrop"]), -int(frame["YCrop"])
        # ))
        print("  %.3f%%{ transform: translate(-32px, -32px) scale(%s) translate(%spx, %spx) rotate(%sdeg) scale(%s,%s) translate(%spx, %spx); background-position: %dpx  %dpx;}" %(
            cur_time*100/anm_len,
            BASE_SCALE,
            frame["XPos"], 
            frame["YPos"],
            frame["Rotation"],
            frame["XScale"]/100, frame["YScale"]/100,
            -frame["XPiv"]+32,-frame["YPiv"]+32, 
            -int(frame["XCrop"]), -int(frame["YCrop"])
        ))

        cur_time += frame["Duration"]
    print("}")