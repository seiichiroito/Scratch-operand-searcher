<template>
  <div class="hello">
    <h2>単元表</h2>
    <p>
      選択したゲーム:
      <select v-model="selected">
        <option
          v-for="project in projects"
          :value="project.name"
          :key="project.name"
        >
          {{ project.name }}
        </option>
      </select>
    </p>
    <select v-model="visible">
      <option value="all">全て表示</option>
      <option value="only">存在する命令のみ表示</option>
    </select>
    <ul>
      <li
        v-for="(opcode, index) in Object.entries(search_operators)"
        :key="opcode[1][0]"
      >
        <span v-if="visible == 'all'">
          {{ opcode[0] }} : {{ opcode_numbers[index] }}
        </span>
        <span v-else
          >{{
            opcode_numbers[index] > 0
              ? opcode[0] + " : " + opcode_numbers[index]
              : ""
          }}
        </span>
      </li>
    </ul>
  </div>
</template>

<script setup>
// Game
import projects from "./json/project";

import search_operators from "./json/operators";
import { ref } from "@vue/reactivity";
import { computed } from "@vue/runtime-core";

// Data
const selected = ref(projects[0].name);
const visible = ref("all");

// Mutation
const jsonData = computed(() => {
  return projects.find((project) => project.name == selected.value).game;
});
const opcodes = computed(() => {
  var blocks = jsonData.value.targets.map((sprite) => {
    return sprite.blocks;
  });

  return blocks
    .map((block) => {
      return Object.values(block).map((code) => {
        return {
          opcode: code.opcode,
          inputs: code.inputs,
          mutation: code.mutation,
        };
      });
    })
    .flat(1);
});

const opcode_numbers = computed(() => {
  var count = Object.values(search_operators).map((search_operator) => {
    // Block定義
    if (search_operator[0] === "procedures_prototype") {
      return block_def(search_operator);
    }

    // 文字列、数式判定
    if (
      search_operator[0] === "operator_equals" &&
      (search_operator[1] === "string" || search_operator[1] === "integer")
    ) {
      return operator_def(search_operator);
    }

    // メッセージ
    if (search_operator[0] === "broadcasts") {
      return broadcast_def(search_operator);
    }

    // 変数
    if (search_operator[0] === "variables") {
      return variable_def(search_operator);
    }

    // リスト
    if (search_operator[0] === "lists") {
      return list_def(search_operator);
    }

    // その他
    return opcodes.value.filter((opcode) => {
      return search_operator.find((el) => el === opcode.opcode);
    }).length;
  });
  return count;
});

function search(name) {
  var count = opcodes.value.filter((opcode) => {
    return opcode === name;
  });

  return count;
}

function block_def(search_operator) {
  switch (search_operator[1]) {
    case "input == 0":
      return opcodes.value.filter((opcode) => {
        return (
          search_operator.find((el) => el === opcode.opcode) &&
          !Object.keys(opcode.inputs).length
        );
      }).length;
    case "input != 0":
      return opcodes.value.filter((opcode) => {
        return (
          search_operator.find((el) => el === opcode.opcode) &&
          Object.keys(opcode.inputs).length
        );
      }).length;
    case "warp == true":
      return opcodes.value.filter((opcode) => {
        return (
          search_operator.find((el) => el === opcode.opcode) &&
          opcode.mutation.warp === "true"
        );
      }).length;

    default:
      return -1;
  }
}
function variable_def(search_operator) {
  var blocks = jsonData.value.targets.map((sprite) => {
    return {
      isStage: sprite.isStage,
      variables: sprite.variables,
    };
  });
  var variables = blocks
    .filter((block) => Object.keys(block.variables).length)
    .map((block) => Object.values(block.variables).map((v) => v[0]))
    .flat(1);
  var search_words = [];
  switch (search_operator[1]) {
    case "accelerate":
      search_words = ["重力", "はやさ", "じゅうりょく", "ジャンプ"];
      return variables.filter((v) =>
        search_words.some((word) => v.includes(word))
      ).length;
    case "flag":
      search_words = ["フラグ", "flag"];
      return variables.filter((v) =>
        search_words.some((word) => v.includes(word))
      ).length;
    case "private":
      return blocks.reduce((count, block) => {
        if (!block.isStage) {
          return count + Object.keys(block.variables).length;
        } else {
          return count;
        }
      }, 0);
    case "cloud":
      var stage = blocks.find((block) => block.isStage);
      return Object.values(stage.variables).filter((variable) =>
        variable[0].includes("☁")
      ).length;
    default:
      return -1;
  }
}
function list_def(search_operator) {
  var blocks = jsonData.value.targets.map((sprite) => {
    return {
      isStage: sprite.isStage,
      lists: sprite.lists,
    };
  });
  switch (search_operator[1]) {
    case "public":
      return blocks.reduce((count, block) => {
        if (block.isStage) {
          return count + Object.keys(block.lists).length;
        } else {
          return count;
        }
      }, 0);
    case "private":
      return blocks.reduce((count, block) => {
        if (!block.isStage) {
          return count + Object.keys(block.lists).length;
        } else {
          return count;
        }
      }, 0);
    default:
      return -1;
  }
}
function operator_def(search_operator) {
  if (search_operator[1] === "string") {
    return opcodes.value.filter((opcode) => {
      var target_input;
      if (search_operator.find((el) => el === opcode.opcode)) {
        var target_v = Object.values(opcode.inputs).find(
          (input) => input[0] === 1
        );

        if (!target_v) {
          return false;
        }
        target_input = target_v[1][1];
      }
      if (!target_input) {
        return false;
      }
      return !Number.isInteger(+target_input);
    }).length;
  }
  if (search_operator[1] === "integer") {
    return opcodes.value.filter((opcode) => {
      var target_input;
      if (search_operator.find((el) => el === opcode.opcode)) {
        var target_v = Object.values(opcode.inputs).find(
          (input) => input[0] === 1
        );

        if (!target_v) {
          return false;
        }
        target_input = target_v[1][1];
      }
      if (!target_input) {
        return false;
      }
      return Number.isInteger(+target_input);
    }).length;
  }

  return -1;
}
function broadcast_def(search_operator) {
  var broadcasts = Object.values(
    jsonData.value.targets.find((sprite) => sprite.isStage).broadcasts
  );
  if (search_operator[1] === "string") {
    return broadcasts.filter((name) => !Number.isInteger(+name)).length;
  }
  if (search_operator[1] === "integer") {
    return broadcasts.filter((name) => Number.isInteger(+name)).length;
  }
  return -1;
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
h1,
h2 {
  font-weight: normal;
}

ul {
  list-style-type: none;
  padding: 0;
  width: 500px;
  margin: 0 auto;
  text-align: left;
}

li {
  /* display: inline-block; */
  margin: 5px 10px;
}

a {
  color: #42b983;
}
</style>
