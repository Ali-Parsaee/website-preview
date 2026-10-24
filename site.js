'use strict';
const svg = (title, body) => `<svg viewBox="0 0 440 185" role="img" aria-label="${title}"><title>${title}</title>${body}</svg>`;
const line = (x1,y1,x2,y2,color='#8a9f91',dash='') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="2" ${dash ? `stroke-dasharray="${dash}"` : ''}/>`;
const dot = (x,y,color='#52745d',r=4) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
const label = (x,y,t,anchor='start') => `<text x="${x}" y="${y}" text-anchor="${anchor}">${t}</text>`;
const topics = {
  spend: {
    kicker: '04 / SPEND · CURRENT FOCUS',
    title: 'Which observation is worth paying for?',
    description: 'In a clinical study, an outcome may not have happened when follow-up ends. We know something, but not everything. I study how to spend a limited budget on the observations that matter most.',
    drawing: svg('Conceptual follow-up timelines: some outcomes are observed, others remain censored; additional follow-up has a cost.',
      `<text x="32" y="17" class="chart-title">OBSERVE LONGER, OR OBSERVE SOMEONE ELSE?</text>`+
      label(32,48,'A')+line(60,44,195,44)+dot(195,44)+
      label(32,78,'B')+line(60,74,160,74)+line(160,67,160,81,'#52745d')+line(165,74,323,74,'#a64d32','4 5')+label(335,78,'+ cost')+
      label(32,108,'C')+line(60,104,275,104)+dot(275,104)+
      label(32,138,'D')+line(60,134,210,134)+line(210,127,210,141,'#52745d')+line(215,134,323,134,'#a64d32','4 5')+
      line(60,153,395,153,'#bdc9b8')+label(395,169,'follow-up time →','end')+
      dot(34,182)+label(45,185,'observed')+line(133,176,133,184,'#52745d')+label(144,185,'censored')+label(275,185,'conceptual example')),
    math: '<p>Choose follow-up decisions <i>S</i> to maximize their information value, subject to a budget <i>B</i>.</p><p class="equation">maximize I(S) &nbsp; subject to &nbsp; Σ cost(i) ≤ B</p><p>In my master’s thesis, a maximum-coverage formulation gives a (1 − 1/e) approximation guarantee for the corresponding batch selection problem. The guarantee depends on that formulation; it is not a claim about every information objective.</p>'
  },
  acquire: {
    kicker: '01 / ACQUIRE · COLLECTIVE INTELLIGENCE',
    title: 'What can many noisy minds learn together?',
    description: 'One source can be unreliable. Several sources may help—if their errors do not all agree. I study crowds and swarms of language models, and what becomes possible when information is distributed across agents.',
    drawing: svg('Conceptual diagram: five noisy sources combine into one collective judgment.',
      `<text x="26" y="17" class="chart-title">DIFFERENT SIGNALS, A COLLECTIVE JUDGMENT</text>`+
      [45,72,99,126,153].map((y,i)=>line(82,y,246,99,'#b4c2b1')+dot(70,y,i===1?'#a64d32':'#52745d',7)).join('')+
      `<circle cx="257" cy="99" r="25" fill="none" stroke="#52745d" stroke-width="1.5"/>`+label(257,105,'Σ','middle')+line(284,99,350,99)+dot(362,99,'#a64d32',10)+label(70,180,'noisy sources','middle')+label(256,145,'combine','middle')+label(361,145,'decision','middle')),
    math: '<p>A classical Condorcet setting makes the idea precise: if independent voters each have probability <i>p &gt; ½</i> of being correct on a binary question, a majority becomes more reliable as the crowd grows.</p><p class="equation">P(majority correct) → 1 &nbsp; as n → ∞</p><p>Model errors can be correlated. The independence assumption is a useful reference point, not something to assume about a crowd of language models.</p>'
  },
  hold: {
    kicker: '02 / HOLD · HIERARCHICAL MEMORY',
    title: 'How much detail is worth keeping?',
    description: 'Remembering everything has a cost. Forgetting everything wastes experience. I study hierarchical memory for language agents: how useful information can be retained at different levels of detail.',
    drawing: svg('Conceptual hierarchy: detailed observations combine into summaries, and summaries into abstractions.',
      `<text x="25" y="17" class="chart-title">DETAIL CAN CHANGE; USEFUL STRUCTURE CAN STAY</text>`+
      [50,95,140,185,255,300,345,390].map((x,i)=>line(x,142,i<4?118:322,91,'#b4c2b1')+dot(x,148,'#8a9f91',4)).join('')+
      line(118,86,220,45,'#8a9f91')+line(322,86,220,45,'#8a9f91')+
      `<rect x="79" y="76" width="78" height="26" fill="#ecefe6" stroke="#52745d"/><rect x="283" y="76" width="78" height="26" fill="#ecefe6" stroke="#52745d"/>`+
      label(118,93,'summary','middle')+label(322,93,'summary','middle')+dot(220,43,'#a64d32',7)+label(239,47,'abstraction')+label(220,180,'many details → fewer representations','middle')),
    math: '<p>The research question is how to trade memory cost against the future usefulness of retained information.</p><p class="equation">retain detail ↔ preserve future decision value</p><p>The hierarchy above is a conceptual illustration, not a measured result. Open the memory papers below for the specific work behind this question.</p>'
  },
  price: {
    kicker: '03 / PRICE · GENERALIZATION',
    title: 'What did the model actually learn?',
    description: 'A model can remember examples without learning what transfers beyond them. I am interested in the difference—and what it tells us about the value of a dataset.',
    drawing: svg('Conceptual curves distinguish fit to seen examples from transfer to new examples. These are illustrative, not experimental results.',
      `<text x="28" y="17" class="chart-title">FITTING EXAMPLES IS NOT THE SAME AS TRANSFER</text>`+
      line(55,145,385,145,'#b4c2b1')+line(55,145,55,36,'#b4c2b1')+
      `<path d="M55 138 C110 130 125 55 180 48 S300 42 385 42" fill="none" stroke="#52745d" stroke-width="2"/><path d="M55 140 C110 137 160 128 202 115 S290 84 385 80" fill="none" stroke="#a64d32" stroke-width="2" stroke-dasharray="5 4"/>`+
      label(385,35,'seen examples','end')+label(385,102,'new examples','end')+label(385,165,'training →','end')+label(55,183,'illustrative curves · not measured results')),
    math: '<p>The organizing question is how to distinguish learning that transfers from learning tied to particular examples.</p><p class="equation">value of data ≠ number of examples</p><p>“Generalization versus memorization” is in preparation. This figure explains the question; it does not present findings from the paper.</p>'
  },
  ask: {
    kicker: '05 / ASK · FUTURE DIRECTIONS',
    title: 'When is asking worth its cost?',
    description: 'A hint may help now, but doing the work yourself can build a skill you need later. I want to understand when to ask an oracle, when to defer to a partner, and when to keep trying.',
    drawing: svg('Conceptual choice: a learner can attempt a task independently or ask a partner; both routes have immediate and future costs.',
      `<text x="25" y="17" class="chart-title">AN ANSWER NOW; A CAPABILITY LATER</text>`+
      `<path d="M100 100 Q200 100 245 57 H370 M100 100 Q200 100 245 143 H370" fill="none" stroke="#b4c2b1" stroke-width="1.5"/>`+
      dot(90,100,'#52745d',12)+dot(260,57,'#a64d32',6)+dot(260,143,'#52745d',6)+label(90,135,'learner','middle')+label(277,49,'ask a partner')+label(277,74,'pay for a hint')+label(277,135,'try yourself')+label(277,160,'invest in skill')+label(25,183,'a research question, not a settled rule')),
    math: '<p>A useful starting question is whether the immediate benefit of help exceeds its direct cost and its longer-term effect on learning.</p><p class="equation">benefit now − cost now + effect on future skill</p><p>This is a conceptual trade-off, not an established decision rule. Comparative advantage and skill decay motivate the proposed two-agent collaboration work.</p>'
  }
};
const nodes = [...document.querySelectorAll('[data-topic]')];
function selectTopic(key) {
  const topic = topics[key];
  if (!topic) return;
  nodes.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.topic === key)));
  document.querySelectorAll('[data-path]').forEach(path => path.classList.toggle('chosen', path.dataset.path === key));
  document.querySelector('#topic-kicker').textContent = topic.kicker;
  document.querySelector('#topic-title').textContent = topic.title;
  document.querySelector('#topic-description').textContent = topic.description;
  document.querySelector('#topic-drawing').innerHTML = topic.drawing;
  document.querySelector('#topic-math').innerHTML = topic.math;
  document.querySelector('#topic-papers').dataset.filterTarget = key;
  document.querySelector('.math-detail').open = false;
}
nodes.forEach((button,index) => {
  button.addEventListener('click', () => selectTopic(button.dataset.topic));
  button.addEventListener('keydown', event => {
    if (!['ArrowRight','ArrowLeft','ArrowDown','ArrowUp'].includes(event.key)) return;
    event.preventDefault();
    const step = ['ArrowRight','ArrowDown'].includes(event.key) ? 1 : -1;
    const next = nodes[(index + step + nodes.length) % nodes.length];
    next.focus(); selectTopic(next.dataset.topic);
  });
});
function filterPapers(key) {
  let count = 0;
  document.querySelectorAll('.paper').forEach(paper => {
    paper.hidden = key !== 'all' && paper.dataset.leg !== key;
    if (!paper.hidden) count++;
  });
  document.querySelectorAll('[data-filter]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === key)));
  document.querySelector('#filter-status').textContent = `Showing ${count} research ${count === 1 ? 'entry' : 'entries'}${key === 'all' ? '' : ' in ' + key}.`;
}
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => filterPapers(button.dataset.filter)));
document.querySelector('#topic-papers').addEventListener('click', event => filterPapers(event.currentTarget.dataset.filterTarget));
selectTopic('spend');
