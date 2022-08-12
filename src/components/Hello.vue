<template>
  <div class="hello">
    <h2>単元表</h2>
    <div>Selected: {{ selected }}</div>

    <select v-model="selected">
      <option>Please select one</option>
      <option>A</option>
      <option>B</option>
      <option>C</option>
    </select>
    <ul>
      <li
        v-for="(opcode, index) in Object.entries(search_operators)"
        :key="opcode[1][0]"
      >
        {{ opcode[0] }} : {{ opcode_numbers[index] }}
      </li>
    </ul>
  </div>
</template>

<script>
import project from "./json/project.json";
import operators from "./json/operators";
export default {
  name: "hello",
  data() {
    return {
      search_operators: operators,
      jsonData: project,
    };
  },
  computed: {
    opcodes() {
      var blocks = this.jsonData.targets.map((sprite) => {
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
    },
    counter(name) {
      return this.search(name);
    },
    opcode_numbers() {
      var count = Object.values(this.search_operators).map(
        (search_operator) => {
          // Block定義
          if (search_operator[0] === "procedures_prototype") {
            return this.block_def(search_operator);
          }

          // 文字列、数式判定
          if (
            search_operator[0] === "operator_equals" &&
            (search_operator[1] === "string" ||
              search_operator[1] === "integer")
          ) {
            return this.operator_def(search_operator);
          }

          // メッセージ
          if (search_operator[0] === "broadcasts") {
            return this.broadcast_def(search_operator);
          }

          // 変数
          if (search_operator[0] === "variables") {
            return this.variable_def(search_operator);
          }

          // リスト
          if (search_operator[0] === "lists") {
            return this.list_def(search_operator);
          }

          // その他
          return this.opcodes.filter((opcode) => {
            return search_operator.find((el) => el === opcode.opcode);
          }).length;
        }
      );
      return count;
    },
  },
  methods: {
    search(name) {
      var count = this.opecodes.filter((opcode) => {
        return opcode === name;
      });

      return count;
    },
    async previewFiles(event) {
      var file = event.target.files[0];
      if (!file) return;
      var result = await file.text();

      this.jsonData = JSON.parse(result);
    },
    block_def(search_operator) {
      switch (search_operator[1]) {
        case "input == 0":
          return this.opcodes.filter((opcode) => {
            return (
              search_operator.find((el) => el === opcode.opcode) &&
              !Object.keys(opcode.inputs).length
            );
          }).length;
        case "input != 0":
          return this.opcodes.filter((opcode) => {
            return (
              search_operator.find((el) => el === opcode.opcode) &&
              Object.keys(opcode.inputs).length
            );
          }).length;
        case "warp == true":
          return this.opcodes.filter((opcode) => {
            return (
              search_operator.find((el) => el === opcode.opcode) &&
              opcode.mutation.warp === "true"
            );
          }).length;

        default:
          return -1;
      }
    },
    variable_def(search_operator) {
      var blocks = this.jsonData.targets.map((sprite) => {
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
    },
    list_def(search_operator) {
      var blocks = this.jsonData.targets.map((sprite) => {
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
    },
    operator_def(search_operator) {
      if (search_operator[1] === "string") {
        return this.opcodes.filter((opcode) => {
          var target_input;
          if (search_operator.find((el) => el === opcode.opcode)) {
            target_input = Object.values(opcode.inputs).find(
              (input) => input[0] === 1
            )[1][1];
          }
          if (!target_input) {
            return false;
          }
          return !Number.isInteger(+target_input);
        }).length;
      }
      if (search_operator[1] === "integer") {
        return this.opcodes.filter((opcode) => {
          var target_input;
          if (search_operator.find((el) => el === opcode.opcode)) {
            target_input = Object.values(opcode.inputs).find(
              (input) => input[0] === 1
            )[1][1];
          }
          if (!target_input) {
            return false;
          }
          return Number.isInteger(+target_input);
        }).length;
      }

      return -1;
    },
    broadcast_def(search_operator) {
      var broadcasts = Object.values(
        this.jsonData.targets.find((sprite) => sprite.isStage).broadcasts
      );
      if (search_operator[1] === "string") {
        return broadcasts.filter((name) => !Number.isInteger(+name)).length;
      }
      if (search_operator[1] === "integer") {
        return broadcasts.filter((name) => Number.isInteger(+name)).length;
      }
      return -1;
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
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
