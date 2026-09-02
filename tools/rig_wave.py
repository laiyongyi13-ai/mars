"""
给 heimeiqiu.glb 加骨骼 + 挥手动画，导出 heimeiqiu_wave.glb
------------------------------------------------------------
用法（装好 Blender 后，在本文件夹执行）：

  blender --background --python rig_wave.py

产物：bloom-on-mars/public/models/heimeiqiu_wave.glb
里面含一个名为 "wave" 的动画 clip。

原理：
  - 导入模型，建一个 2 骨骼骨架：body(根) + arm(右臂)
  - 按"右臂包围盒"把该区域顶点权重刷给 arm 骨骼，其余给 body
  - 给 arm 骨骼 K 帧一段来回摆动 = 挥手
  - 导出带动画的 GLB

如果挥动的部位不对，调下面 ARM_BOX 的 min/max（模型局部坐标，
可先在 Blender GUI 里选中手臂看它的坐标范围再填）。
"""
import bpy
import os
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "..", "public", "models", "heimeiqiu.glb")
OUT = os.path.join(HERE, "..", "public", "models", "heimeiqiu_wave.glb")

# 右臂区域包围盒（模型局部坐标，先粗调，跑完不对再改）
# x 正方向假设为角色右侧；手臂在身体侧下方
ARM_BOX_MIN = Vector((0.15, -0.10, -0.20))
ARM_BOX_MAX = Vector((0.80,  0.45,  0.40))

# ---- 清空场景 ----
bpy.ops.wm.read_factory_settings(use_empty=True)

# ---- 导入 ----
bpy.ops.import_scene.gltf(filepath=SRC)
mesh_obj = next(o for o in bpy.context.scene.objects if o.type == "MESH")

# 归一化尺寸信息
bb = [Vector(c) for c in mesh_obj.bound_box]
mn = Vector((min(v.x for v in bb), min(v.y for v in bb), min(v.z for v in bb)))
mx = Vector((max(v.x for v in bb), max(v.y for v in bb), max(v.z for v in bb)))
size = mx - mn
print("mesh bbox min", mn, "max", mx, "size", size)

# ---- 建骨架 ----
bpy.ops.object.armature_add(enter_editmode=True, location=(0, 0, 0))
arm_obj = bpy.context.object
arm_obj.name = "HeimeiqiuRig"
eb = arm_obj.data.edit_bones
root = eb[0]
root.name = "body"
root.head = (0, 0, mn.z)
root.tail = (0, 0, mx.z)

arm = eb.new("arm")
arm_center = (ARM_BOX_MIN + ARM_BOX_MAX) * 0.5
arm.head = (arm_center.x, arm_center.y, ARM_BOX_MIN.z)
arm.tail = (arm_center.x, arm_center.y, ARM_BOX_MAX.z)
arm.parent = root
bpy.ops.object.mode_set(mode="OBJECT")

# ---- 顶点分组权重 ----
mesh_obj.parent = arm_obj
mod = mesh_obj.modifiers.new(name="Armature", type="ARMATURE")
mod.object = arm_obj

vg_body = mesh_obj.vertex_groups.new(name="body")
vg_arm = mesh_obj.vertex_groups.new(name="arm")

def in_box(co):
    return (ARM_BOX_MIN.x <= co.x <= ARM_BOX_MAX.x and
            ARM_BOX_MIN.y <= co.y <= ARM_BOX_MAX.y and
            ARM_BOX_MIN.z <= co.z <= ARM_BOX_MAX.z)

for v in mesh_obj.data.vertices:
    if in_box(v.co):
        vg_arm.add([v.index], 1.0, "REPLACE")
    else:
        vg_body.add([v.index], 1.0, "REPLACE")

# ---- 挥手动画 ----
arm_obj.animation_data_create()
action = bpy.data.actions.new(name="wave")
arm_obj.animation_data.action = action

bpy.context.scene.frame_start = 1
bpy.context.scene.frame_end = 48
pbone = arm_obj.pose.bones["arm"]
pbone.rotation_mode = "XYZ"

# 抬臂 + 来回摆动
keys = [(1, 0.0), (8, 1.1), (18, 0.7), (28, 1.1), (38, 0.7), (48, 0.0)]
for f, ang in keys:
    pbone.rotation_euler = (0, ang, 0)
    pbone.keyframe_insert("rotation_euler", frame=f)

# ---- 导出 ----
bpy.ops.object.select_all(action="DESELECT")
mesh_obj.select_set(True)
arm_obj.select_set(True)
bpy.context.view_layer.objects.active = arm_obj

bpy.ops.export_scene.gltf(
    filepath=OUT,
    export_format="GLB",
    export_animations=True,
    use_selection=True,
    export_yup=True,
)
print("exported:", OUT)
